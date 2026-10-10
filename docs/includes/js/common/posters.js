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

export function posterCard({href, image, title, progress}) {
  const a = document.createElement('a');
  a.href = href;

  const img = document.createElement('img');
  img.src = image || NO_IMAGE;
  img.alt = '';
  img.loading = 'lazy';
  a.appendChild(img);

  if (typeof progress === 'number') {
    const bar = document.createElement('progress');
    bar.max = 100;
    bar.value = progress;
    bar.title = `${progress}%`;
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
  }

  button.addEventListener('click', load);
  await load();
}
