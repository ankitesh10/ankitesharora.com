const storageKey = "theme-preference";
const root = document.documentElement;

const getSystemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const storedTheme = localStorage.getItem(storageKey);
const theme =
  storedTheme === "light" || storedTheme === "dark"
    ? storedTheme
    : getSystemTheme();

root.classList.toggle("dark", theme === "dark");
root.classList.toggle("light", theme === "light");
root.dataset.theme = theme;
