/* assets/js/sidebar-sections.js
   Dynamically populates sidebar sub-navigation from page h2 headings
   and highlights the current section on scroll. */

document.addEventListener('DOMContentLoaded', function() {
    // Find h2 elements with IDs inside page content
    var headings = document.querySelectorAll('.page-content h2[id]');
    if (!headings.length) return;

    // Find the selected nav-item that has a sub-list
    var selectedItem = document.querySelector('.icon-nav-item.selected[data-has-sections]');
    if (!selectedItem) return;
    var subList = selectedItem.querySelector('.nav-sub-list');
    if (!subList) return;

    // Build sub-items from h2 headings
    var subItems = [];
    headings.forEach(function(h2) {
        var li = document.createElement('li');
        li.className = 'nav-sub-item';
        var a = document.createElement('a');
        a.href = '#' + h2.id;
        a.textContent = h2.textContent;
        li.appendChild(a);
        subList.appendChild(li);
        subItems.push({ el: li, target: h2 });
    });

    if (!subItems.length) return;

    // Scroll spy using IntersectionObserver
    var currentActive = null;

    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                // Find matching sub-item
                for (var i = 0; i < subItems.length; i++) {
                    if (subItems[i].target === entry.target) {
                        if (currentActive) {
                            currentActive.classList.remove('active');
                        }
                        subItems[i].el.classList.add('active');
                        currentActive = subItems[i].el;
                        break;
                    }
                }
            }
        });
    }, {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0
    });

    headings.forEach(function(h2) {
        observer.observe(h2);
    });

    // Activate first item by default
    if (subItems.length > 0) {
        subItems[0].el.classList.add('active');
        currentActive = subItems[0].el;
    }
});
