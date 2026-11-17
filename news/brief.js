const archive = document.querySelector("#archive");
const edition = document.querySelector("#edition");
const status = document.querySelector("#status");
const brief = document.querySelector("#brief");

function element(tag, value, className) {
  const node = document.createElement(tag);
  node.textContent = value;
  if (className) node.className = className;
  return node;
}

function sourceLink(source) {
  try {
    const url = new URL(source.url);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const link = element("a", source.label);
    link.href = url.href;
    return link;
  } catch {
    return null;
  }
}

async function loadEditions() {
  const response = await fetch("editions.json", { cache: "no-cache" });
  if (!response.ok) throw new Error("Archive unavailable");
  const editions = await response.json();
  const dates = Object.keys(editions).filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date)).sort().reverse();

  if (!dates.length) {
    status.textContent = "The first edition will appear here.";
    return;
  }

  const formatDate = date => new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(new Date(date));
  function render() {
    const date = edition.value;
    const issue = element("div", "", "issue");
    issue.append(element("h2", formatDate(date)));
    for (const story of editions[date]) {
      const article = document.createElement("article");
      article.append(element("h3", story.title), element("p", story.summary));
      const takeaway = document.createElement("p");
      takeaway.append(element("strong", "Why it matters "), story.takeaway);
      article.append(takeaway);
      const sources = element("p", "", "sources");
      const links = story.sources.map(sourceLink).filter(Boolean);
      links.forEach((link, index) => {
        if (index) sources.append(" · ");
        sources.append(link);
      });
      article.append(sources);
      issue.append(article);
    }
    brief.replaceChildren(issue);
  }

  for (const date of dates) {
    const option = element("option", formatDate(date));
    option.value = date;
    edition.append(option);
  }
  const syncFromUrl = () => {
    const date = new URL(location.href).searchParams.get("date");
    edition.value = dates.includes(date) ? date : dates[0];
    render();
  };
  edition.addEventListener("change", () => {
    const url = new URL(location.href);
    url.searchParams.set("date", edition.value);
    history.pushState(null, "", url);
    render();
  });
  window.addEventListener("popstate", syncFromUrl);
  syncFromUrl();
  status.hidden = true;
  archive.hidden = false;
}

loadEditions().catch(() => {
  status.textContent = "Editions are temporarily unavailable. Please try again later.";
});
