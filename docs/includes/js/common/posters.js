const NO_IMAGE = '/includes/img/image_not_available.png';

export function itemImage(item) {
  const url = item.apiCache.imageUrl;
  if (url === null || url === undefined) {
    return NO_IMAGE;
  }
  if (item.apiName === 'tmdb' && !url.includes('http')) {
    return `https://image.tmdb.org/t/p/w500/${url}`;
  }
  return url.replace('original_untouched', 'medium_portrait');
}

export function progressClass(progress) {
  return progress >= 100 ? 'done' : progress >= 50 ? 'behind' : 'far-behind';
}

export function posterCard({href, image, title, progress}) {
  const a = document.createElement('a');
  a.href = href;

  const img = document.createElement('img');
  img.src = image || NO_IMAGE;
  img.alt = '';
  img.loading = 'lazy';
  // Cached poster URLs go stale when the source moves them
  img.addEventListener('error', () => img.src = NO_IMAGE, {once: true});
  a.appendChild(img);

  if (typeof progress === 'number') {
    const bar = document.createElement('progress');
    bar.max = 100;
    bar.value = progress;
    bar.title = `${progress}%`;
    bar.className = progressClass(progress);
    a.appendChild(bar);
  }

  const caption = document.createElement('small');
  caption.textContent = title;
  caption.title = title;
  a.appendChild(caption);

  return a;
}

export function itemCard(item, showProgress = false) {
  return posterCard({
    href: `review.html?api_name=${item.apiName}&api_id=${item.apiId}`,
    image: itemImage(item),
    title: item.apiCache.title,
    progress: showProgress ? item.epProgress : undefined,
  });
}

// Shows the number of items in `list` next to the page heading: "visible of total"
// when some are hidden, "+" when more pages can be loaded.
export function updateCount(list, more = false) {
  const counter = document.getElementById('itemCount');
  if (counter === null) {
    return;
  }
  const items = [...list.children];
  if (items.length === 0 && more) {
    counter.textContent = ''; // still loading
    return;
  }
  const visible = items.filter(el => el.checkVisibility()).length;
  let text = visible === items.length ? `${items.length}` : `${visible} of ${items.length}`;
  if (more) {
    text += '+';
  }
  counter.textContent = text;
}

// Shows a "Load more" button after `list` while loadMore() returns true (more items available).
export async function loadMoreButton(list, loadMore) {
  const button = document.createElement('button');
  button.className = 'secondary outline';
  button.textContent = 'Load more';
  button.hidden = true;
  list.after(button);

  async function load() {
    button.setAttribute('aria-busy', 'true');
    button.hidden = !(await loadMore());
    button.removeAttribute('aria-busy');
    updateCount(list, !button.hidden);
  }

  button.addEventListener('click', load);
  await load();
}

// Loads every page into `list`; loadPage() returns false when there are no more pages.
// For filtered lists, where the API keeps returning cursors to pages with nothing left.
export async function loadAll(list, loadPage, items = list) {
  updateCount(items, true);
  list.setAttribute('aria-busy', 'true');
  while (await loadPage()) {
    // keep going
  }
  list.removeAttribute('aria-busy');
  updateCount(items);
}

// Wires the #hideDone switch to hide 100% items in `list`, remembered across visits.
export function hideDoneToggle(list) {
  const toggle = document.getElementById('hideDone');
  try {
    toggle.checked = localStorage.getItem('moshan_hide_done') === 'true';
  } catch {
    // storage unavailable, default to showing everything
  }
  list.classList.toggle('hide-done', toggle.checked);

  toggle.addEventListener('change', () => {
    list.classList.toggle('hide-done', toggle.checked);
    updateCount(list);
    try {
      localStorage.setItem('moshan_hide_done', toggle.checked);
    } catch {
      // ignore
    }
  });
}
