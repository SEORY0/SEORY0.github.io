---
layout: page
title: Tags
---

<style>
	#tags-container {
	    max-width: 100%;
	}

	.tags-cloud {
		margin: 2rem 0 3rem 0;
		padding: 1.5rem;
		background: rgb(236, 237, 238);
	}

	.tag-link {
		display: inline-block;
		margin: 0.3rem;
		padding: 0.5rem 1rem;
		background: #fff;
		text-decoration: none;
		color: #333;
		transition: all 0.2s;
		font-size: 0.95rem;
	}

	.tag-link:hover {
		background: #333;
		color: #fff;
	}

	.tag-count {
		font-size: 0.85em;
		color: #999;
	}

	.tag-link:hover .tag-count {
		color: #fff;
	}

	.tags-list {
		margin-top: 2rem;
	}

	.tags-list h2 {
		margin-top: 2.5rem;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid #333;
		font-size: 1.3rem;
	}

	.post-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.post-list li {
		margin: 0.5rem 0;
		padding: 0.7rem 0;
		border-bottom: 1px solid rgb(236, 237, 238);
	}

	.post-date {
		display: inline-block;
		min-width: 100px;
		color: #999;
		font-size: 0.9em;
		margin-right: 1rem;
	}

	.post-list a {
		color: #333;
		text-decoration: none;
	}

	.post-list a:hover {
		color: #000;
		text-decoration: underline;
	}
</style>

<div id="tags-container">
	<div class="tags-cloud">
		{% assign tags = site.tags | sort %}
		{% for tag in tags %}
		<a href="#{{ tag[0] | slugify }}" class="tag-link">
			{{ tag[0] }} <span class="tag-count">({{ tag[1].size }})</span>
		</a>
		{% endfor %}
	</div>

	<div class="tags-list">
		{% for tag in tags %}
		<h2 id="{{ tag[0] | slugify }}">{{ tag[0] }}</h2>
		<ul class="post-list">
			{% for post in tag[1] %}
			<li>
				<span class="post-date">{{ post.date | date: "%Y-%m-%d" }}</span>
				<a href="{{ post.url }}" title="{{ post.title }}">{{ post.title }}</a>
			</li>
			{% endfor %}
		</ul>
		{% endfor %}
	</div>
</div>