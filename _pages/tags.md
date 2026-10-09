---
layout: page
title: Tags
---

<div class="tags-cloud">
  {% assign tags = site.tags | sort %}
  {% for tag in tags %}
  <a href="#{{ tag[0] | slugify }}" class="box">{{ tag[0] }} ({{ tag[1].size }})</a>
  {% endfor %}
</div>

<div class="tags-list">
  {% for tag in tags %}
  <h2 id="{{ tag[0] | slugify }}">{{ tag[0] }}</h2>
  <ul class="post-list">
    {% for post in tag[1] %}
    <li><span class="post-date">{{ post.date | date: "%Y-%m-%d" }}</span><a href="{{ post.url | relative_url }}">{{ post.title }}</a></li>
    {% endfor %}
  </ul>
  {% endfor %}
</div>
