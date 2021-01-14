/**
 * URLで指定したjavascriptをロードする
 * @param {*} url 
 */
function common() {
    this.loadScript = function(url) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;

        // TODO: 多重実行した後の対処がされていない

        // ヘッダータグにロードするjsスクリプトを追記
        document.getElementsByTagName('head')[0].appendChild(script);

        if (script.readyState) {
            return new Promise((resolve) => {
                script.onreadystatechange = function () {
                    if (script.readyState === 'loaded' || script.readyState === 'complete') {
                        script.onreadystatechange = null;
                        resolve();
                    }
                };
            });
        }
        else {
            return new Promise((resolve) => {
                script.onload = function () {
                    resolve();
                };
            });
        }
    }
}

// 共通モジュールの参照クラス
const common_module = new common();