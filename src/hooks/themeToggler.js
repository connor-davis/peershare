import { createSignal } from 'solid-js';

function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
  let expires = 'expires=' + d.toUTCString();
  document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
}

function getCookie(cname) {
  let name = cname + '=';
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
}

let useThemeToggler = () => {
  let [theme, setTheme] = createSignal(getCookie('theme') || 'light');

  let toggle = () => {
    if (theme() === 'light') {
      setCookie('theme', 'dark', 365);
      setTheme('dark');

      return;
    } else {
      setCookie('theme', 'light', 365);
      setTheme('light');

      return;
    }
  };

  return [theme, toggle];
};

export default useThemeToggler;
