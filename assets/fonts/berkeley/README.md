# Berkeley Mono

The site's monospace is Berkeley Mono by US Graphics Company
(https://usgraphics.com/catalog/FX-102, sold as TX-02 since 2025). It is a
commercial typeface and its files are **not** committed.

To enable it, buy a licence that includes the Web Fonts module and copy the
two files here:

    assets/fonts/berkeley/BerkeleyMono-Regular.woff2
    assets/fonts/berkeley/BerkeleyMono-Bold.woff2

`font.css` already declares both faces and `_sass/_variables.scss` lists
"Berkeley Mono" first in `--mono`; nothing else changes. Without the files
browsers fall through to IBM Plex Mono.

Keep the files out of git if the licence forbids redistribution (add them to
`.gitignore`) and deploy them by other means, or commit them only if the
licence allows it.
