const repos = document.querySelector(".repos");
const searchWrap = repos.querySelector(".repos__search-wrap");
const searchBar = repos.querySelector(".repos__search");
const suggestions = repos.querySelector(".repos__suggestions");
const reposList = repos.querySelector(".repos__list");

const url = "https://api.github.com/search/repositories";
const addedRepos = [];
const maxSearchDisplay = 5;
const requestsPerMinute = 10;
const requestDelay = (60 * 1000) / requestsPerMinute;

const debouncedRequest = debounce(request, requestDelay);

searchBar.addEventListener("input", function () {
  search(searchBar.value);
});

async function request(name) {
  let data = [];

  if (name.length === 0) {
    return data;
  }

  try {
    const res = await fetch(`${url}?q=${name.replace(/\s/g, "-")}`);
    const rdata = await res.json();
    if (!res.ok) {
      throw new Error(data.message);
    }

    data = rdata.items;
  } catch (error) {
    console.error(error.message);
  }

  return data;
}

async function search(name) {
  clearSuggestions();

  if (name.length > 0) {
    searchWrap.classList.add("repos__search-wrap--searching");
  }

  const data = await debouncedRequest(name);
  if (data.length > 0) {
    data.sort((a, b) => b.stargazers_count - a.stargazers_count);

    let i = 0;
    let added = 0;
    while (added < maxSearchDisplay && i < data.length) {
      const repo = data[i];

      if (!wasAddedRepository(repo.id)) {
        addToSuggestions({
          id: repo.id,
          name: repo.name,
          owner: repo.owner.login,
          stars: repo.stargazers_count,
        });

        added++;
      }

      i++;
    }
  }

  searchWrap.classList.remove("repos__search-wrap--searching");
}

function debounce(fn, delay = 100) {
  let timerId;
  return function (...args) {
    if (timerId) {
      clearTimeout(timerId);
    }

    return new Promise((res) => {
      timerId = setTimeout(() => res(fn.apply(this, args)), delay);
    });
  };
}

function addToSuggestions(data) {
  const item = document.createElement("li");
  item.classList.add("repos__suggestions-item");

  const btn = document.createElement("button");
  btn.classList.add("repos__suggestions-item-btn");
  btn.textContent = data.name;

  btn.addEventListener("click", function () {
    clearSuggestions();
    searchBar.value = "";

    addRepository(data);
  });

  item.append(btn);

  suggestions.append(item);
}

function clearSuggestions() {
  searchWrap.classList.remove("repos__search-wrap--searching");

  suggestions.innerHTML = "";
}

function addRepository(data) {
  const item = document.createElement("li");
  item.classList.add("repos__item");

  const info = document.createElement("div");
  info.classList.add("repos__item-info");

  const name = document.createElement("div");
  name.classList.add("repos__item-name");
  name.textContent = `Name: ${data.name}`;

  const owner = document.createElement("div");
  owner.classList.add("repos__item-owner");
  owner.textContent = `Owner: ${data.owner}`;

  const stars = document.createElement("div");
  stars.classList.add("repos__item-stars");
  stars.textContent = `Stars: ${data.stars}`;

  info.append(name, owner, stars);

  const removeBtn = document.createElement("button");
  removeBtn.classList.add("repos__item-remove-btn");

  removeBtn.addEventListener("click", function () {
    removeRepository(data.id);
  });

  item.append(info, removeBtn);

  reposList.append(item);

  addedRepos.push({
    element: item,
    id: data.id,
    name: data.name,
    owner: data.owner,
    stars: data.stars,
  });
}

function removeRepository(id) {
  for (const i in addedRepos) {
    const repo = addedRepos[i];
    if (repo.id === id) {
      repo.element.remove();

      addedRepos.splice(i, 1);
      break;
    }
  }
}

function wasAddedRepository(id) {
  return addedRepos.findIndex((repo) => repo.id === id) !== -1;
}
