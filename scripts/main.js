(function () {
  const APPS_ROOT = "content/apps";
  const BLOG_ROOT = "content/blog";

  function renderMarkdown(mdText) {
    if (window.marked && typeof window.marked.parse === "function") {
      return window.marked.parse(mdText);
    }

    return mdText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
  }

  function setStatus(container, text) {
    container.innerHTML = '<p class="status">' + text + "</p>";
  }

  async function loadText(path) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load " + path);
    }

    return response.text();
  }

  function parseDateValue(dateText) {
    if (!dateText) {
      return 0;
    }

    const timestamp = Date.parse(dateText);
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  function parseEntryMarkdown(markdown, slug) {
    const lines = markdown.split("\n");
    const titleLine = lines.find((line) => /^#{1,2}\s+/.test(line.trim()));
    const title = titleLine
      ? titleLine.replace(/^#{1,2}\s+/, "").trim()
      : slug.replace(/-/g, " ");

    const titleIndex = lines.findIndex((line) => line === titleLine);
    const bodyLines = lines.slice(Math.max(0, titleIndex + 1));
    const metadata = {};
    let contentStart = 0;

    for (let i = 0; i < bodyLines.length; i += 1) {
      const current = bodyLines[i].trim();

      if (!current) {
        continue;
      }

      const metaMatch = current.match(/^[-*]\s*([^:]+):\s*(.+)$/);
      if (metaMatch) {
        const key = metaMatch[1].trim().toLowerCase();
        metadata[key] = metaMatch[2].trim();
        contentStart = i + 1;
        continue;
      }

      contentStart = i;
      break;
    }

    const content = bodyLines.slice(contentStart).join("\n").trim();
    const tags = (metadata.tags || "")
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);

    return {
      slug,
      title,
      date: metadata.date || "",
      dateValue: parseDateValue(metadata.date || ""),
      status: metadata.status || "",
      disclaimer: metadata.disclaimer || "",
      tags,
      excerpt: buildExcerpt(content),
      html: renderMarkdown(content),
    };
  }

  function buildExcerpt(markdownContent) {
    const textOnly = markdownContent
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`[^`]*`/g, " ")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/^\s{0,3}#{1,6}\s+/gm, "")
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, "")
      .replace(/\*\*|__|\*|_|~~/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!textOnly) {
      return "No preview available yet.";
    }

    if (textOnly.length <= 180) {
      return textOnly;
    }

    return textOnly.slice(0, 177).trim() + "...";
  }

  function detectGitHubRepo() {
    const hostname = window.location.hostname.toLowerCase();
    if (!hostname.endsWith(".github.io")) {
      return null;
    }

    const owner = hostname.split(".")[0];
    const parts = window.location.pathname.split("/").filter(Boolean);
    const repo = parts.length ? parts[0] : owner + ".github.io";
    const basePath = parts.length ? "/" + repo : "";

    return { owner, repo, basePath };
  }

  async function discoverFolderSlugs(rootPath) {
    const repoInfo = detectGitHubRepo();

    if (repoInfo) {
      const apiUrl =
        "https://api.github.com/repos/" +
        repoInfo.owner +
        "/" +
        repoInfo.repo +
        "/contents/" +
        rootPath;

      const response = await fetch(apiUrl, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to discover folders at " + rootPath);
      }

      const payload = await response.json();
      return payload
        .filter((item) => item.type === "dir")
        .map((item) => item.name)
        .sort();
    }

    // Local fallback: manually maintain _index.json while not running on github.io.
    const fallbackRaw = await loadText(rootPath + "/_index.json");
    const fallback = JSON.parse(fallbackRaw);

    if (!Array.isArray(fallback.items)) {
      throw new Error("Invalid fallback index in " + rootPath + "/_index.json");
    }

    return fallback.items;
  }

  function createTagNode(tag) {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = tag;
    return span;
  }

  function buildEntryPath(rootPath, slug) {
    return rootPath + "/" + slug + "/index.md";
  }

  function buildEntryPageUrl(type, slug) {
    const url = new URL("entry.html", window.location.href);
    url.searchParams.set("type", type);
    url.searchParams.set("slug", slug);
    return url.toString();
  }

  async function loadEntries(rootPath) {
    const slugs = await discoverFolderSlugs(rootPath);

    const entries = await Promise.all(
      slugs.map(async (slug) => {
        const markdown = await loadText(buildEntryPath(rootPath, slug));
        return parseEntryMarkdown(markdown, slug);
      })
    );

    return entries.sort((a, b) => {
      if (b.dateValue !== a.dateValue) {
        return b.dateValue - a.dateValue;
      }

      return a.title.localeCompare(b.title);
    });
  }

  async function renderApps() {
    const container = document.getElementById("apps-container");

    try {
      const entries = await loadEntries(APPS_ROOT);

      if (!entries.length) {
        setStatus(container, "No app entries found in content/apps/<slug>/index.md.");
        return;
      }

      container.innerHTML = "";

      entries.forEach((entry) => {
        const card = document.createElement("article");
        card.className = "card";

        const title = document.createElement("h3");
        title.textContent = entry.title;
        card.appendChild(title);

        if (entry.date) {
          const date = document.createElement("p");
          date.className = "post-date";
          date.textContent = entry.date;
          card.appendChild(date);
        }

        const meta = document.createElement("p");
        meta.className = "meta";

        if (entry.status) {
          meta.appendChild(createTagNode("status: " + entry.status));
        }

        entry.tags.forEach((tag) => meta.appendChild(createTagNode(tag)));

        if (meta.childNodes.length > 0) {
          card.appendChild(meta);
        }

        const preview = document.createElement("p");
        preview.className = "preview";
        preview.textContent = entry.excerpt;
        card.appendChild(preview);

        if (entry.disclaimer) {
          const disclaimer = document.createElement("p");
          disclaimer.className = "disclaimer";
          disclaimer.textContent = "Disclaimer: " + entry.disclaimer;
          card.appendChild(disclaimer);
        }

        const link = document.createElement("a");
        link.className = "entry-link";
        link.href = buildEntryPageUrl("apps", entry.slug);
        link.textContent = "Open full app page";
        card.appendChild(link);

        container.appendChild(card);
      });
    } catch (error) {
      setStatus(container, "Unable to load app markdown content folders.");
      console.error(error);
    }
  }

  async function renderBlog() {
    const container = document.getElementById("blog-container");
    const filter = document.getElementById("tag-filter");

    try {
      const entries = await loadEntries(BLOG_ROOT);

      if (!entries.length) {
        setStatus(container, "No blog posts found in content/blog/<slug>/index.md.");
        return;
      }

      const tags = new Set();
      entries.forEach((entry) => entry.tags.forEach((tag) => tags.add(tag)));

      Array.from(tags)
        .sort()
        .forEach((tag) => {
          const option = document.createElement("option");
          option.value = tag;
          option.textContent = tag;
          filter.appendChild(option);
        });

      function draw() {
        const selectedTag = filter.value;
        container.innerHTML = "";

        const filtered =
          selectedTag === "all"
            ? entries
            : entries.filter((entry) => entry.tags.includes(selectedTag));

        if (!filtered.length) {
          setStatus(container, "No posts match this tag yet.");
          return;
        }

        filtered.forEach((entry) => {
          const article = document.createElement("article");
          article.className = "post";

          const title = document.createElement("h3");
          title.textContent = entry.title;
          article.appendChild(title);

          if (entry.date) {
            const date = document.createElement("p");
            date.className = "post-date";
            date.textContent = entry.date;
            article.appendChild(date);
          }

          const meta = document.createElement("p");
          meta.className = "meta";
          entry.tags.forEach((tag) => meta.appendChild(createTagNode(tag)));

          if (meta.childNodes.length > 0) {
            article.appendChild(meta);
          }

          const preview = document.createElement("p");
          preview.className = "preview";
          preview.textContent = entry.excerpt;
          article.appendChild(preview);

          const link = document.createElement("a");
          link.className = "entry-link";
          link.href = buildEntryPageUrl("blog", entry.slug);
          link.textContent = "Read full post";
          article.appendChild(link);

          container.appendChild(article);
        });
      }

      filter.addEventListener("change", draw);
      draw();
    } catch (error) {
      setStatus(container, "Unable to load blog markdown content folders.");
      console.error(error);
    }
  }

  renderApps();
  renderBlog();
})();
