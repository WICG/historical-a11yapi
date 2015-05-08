# Contributing 

Everyone is welcome to contribute to this specification.

Any simple editorial contribution can simply be done with a GitHub Pull Request.
You can even do an inline edit of the file on GitHub.

# Style guide to contributors 

- the spec uses [ReSpec](https://www.w3.org/respec/) 
- the spec is tidied using [HTML5 Tidy](https://github.com/htacg/tidy-html5). For
instructions on running HTML5 tidy, see below.  
- put comments in front of sections, for better readability with
  syntax coloring editors


# Running HTML5 Tidy

Please make sure you have HTML5 tidy installed, instead of
the the one that  ships with *nix systems. You can comfirm this by running:

```bash 
tidy --version  #HTML Tidy for HTML5 (experimental) for ...
```
Once you have confirmed (make sure you have committed your changes before
running tidy, as the changes are destructive ... in a good way:)):

```bash 
tidy -config tidyconfig.txt -o index.html index.html
```
