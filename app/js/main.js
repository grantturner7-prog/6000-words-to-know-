/* Start the app: apply the saved theme, load the batch list, show the first screen. */
(function (G) {
  'use strict';
  G.applyTheme();
  G.boot().then(() => G.render()).catch(err => {
    console.error(err);
    document.getElementById('app').innerHTML = '<div class="welcome"><div class="glass card hero"><h3>' + G.esc(G.t('err.load')) + '</h3></div></div>';
  });
})(window.G);
