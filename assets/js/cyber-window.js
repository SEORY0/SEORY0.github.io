/* assets/js/cyber-window.js */

(function() {
    var _typeAnimId = null;

    function typeContent(container, html, speed) {
        speed = speed || 12;
        var tmp = document.createElement('div');
        tmp.innerHTML = html;

        var queue = [];
        function walk(source, target) {
            for (var i = 0; i < source.childNodes.length; i++) {
                var node = source.childNodes[i];
                if (node.nodeType === 3) {
                    var text = node.textContent;
                    for (var j = 0; j < text.length; j++) {
                        queue.push({ type: 'char', char: text[j], parent: target });
                    }
                } else if (node.nodeType === 1) {
                    var clone = document.createElement(node.tagName);
                    for (var k = 0; k < node.attributes.length; k++) {
                        clone.setAttribute(node.attributes[k].name, node.attributes[k].value);
                    }
                    queue.push({ type: 'element', el: clone, parent: target });
                    walk(node, clone);
                }
            }
        }

        container.innerHTML = '';
        walk(tmp, container);

        var idx = 0;
        var created = new Map();
        created.set(container, true);

        function ensureParent(el) {
            if (created.has(el)) return;
            var path = [el];
            var p = el;
            while (p && !created.has(p)) {
                path.push(p);
                p = p.parentNode;
            }
            if (!p) return;
            for (var i = path.length - 1; i >= 0; i--) {
                if (!created.has(path[i])) {
                    if (path[i].parentNode) {
                        path[i].parentNode.appendChild(path[i]);
                    }
                    created.set(path[i], true);
                }
            }
        }

        function step() {
            var charsPerFrame = Math.max(1, Math.floor(speed / 4));
            for (var c = 0; c < charsPerFrame && idx < queue.length; c++) {
                var item = queue[idx];
                if (item.type === 'element') {
                    ensureParent(item.parent);
                    item.parent.appendChild(item.el);
                    created.set(item.el, true);
                } else {
                    ensureParent(item.parent);
                    item.parent.appendChild(document.createTextNode(item.char));
                }
                idx++;
            }
            if (idx < queue.length) {
                _typeAnimId = requestAnimationFrame(step);
            } else {
                _typeAnimId = null;
            }
        }

        _typeAnimId = requestAnimationFrame(step);
    }

    function cancelTyping() {
        if (_typeAnimId) {
            cancelAnimationFrame(_typeAnimId);
            _typeAnimId = null;
        }
    }

    // Expose to global scope for onclick handlers
    window.openCyberWindow = function(triggerId) {
        var trigger = document.getElementById(triggerId);
        if (!trigger) return;

        var title = trigger.getAttribute('data-cyber-title') || 'UNKNOWN';
        var contentId = trigger.getAttribute('data-cyber-content');
        var contentEl = contentId ? document.getElementById(contentId) : null;
        var contentHtml = contentEl ? contentEl.innerHTML : '';

        document.getElementById('cyber-window-title').textContent = title;

        var bodyEl = document.getElementById('cyber-window-body');
        bodyEl.innerHTML = '';

        document.getElementById('cyber-overlay').classList.add('active');
        document.body.style.overflow = 'hidden';

        setTimeout(function() {
            typeContent(bodyEl, contentHtml);
        }, 250);
    };

    window.closeCyberWindow = function(e) {
        if (e && e.target && e.target !== e.currentTarget) return;
        cancelTyping();
        document.getElementById('cyber-overlay').classList.remove('active');
        document.body.style.overflow = '';
    };

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            var overlay = document.getElementById('cyber-overlay');
            if (overlay && overlay.classList.contains('active')) {
                cancelTyping();
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    });

    document.addEventListener('mousemove', function(e) {
        var coords = document.getElementById('cyber-coords');
        if (coords) {
            coords.textContent = 'x:' + String(e.clientX).padStart(4, '0') + ' y:' + String(e.clientY).padStart(4, '0');
        }
    });
})();
