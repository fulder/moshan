path = window.location.pathname

if (path.match("^/anime/[0-9a-f\-]+$") !== null) {
    window.location.href = "/anime";
}
console.log(path)