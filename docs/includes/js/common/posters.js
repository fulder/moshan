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

  if (progress !== undefined) {
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

// Calls loadMore() when scrolled to the bottom. loadMore returns false when there is nothing more to load.
export function infiniteScroll(loadMore) {
  let loading = false;
  let done = false;

  document.addEventListener('scroll', async () => {
    if (loading || done || window.innerHeight + window.scrollY < document.body.offsetHeight - 200) {
      return;
    }
    loading = true;
    done = (await loadMore()) === false;
    loading = false;
  });
}
