/**
 * 共通処理群
 * よく使われる処理をまとめた
 */
function common() {
    /**
    * URLで指定したjavascriptファイルをロード/アンロードする
    * @param {*} url 
    */
    this.loadScript = function (url) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;

        // TODO: 失敗した場合の例外処理をいれた方がいい

        // ヘッダータグにロードするjsスクリプトを追記
        document.getElementsByTagName('head')[0].appendChild(script);

        if (script.readyState) {
            return new Promise((resolve, reject) => {
                script.onerror = function (e) {
                    reject(null);
                };

                script.onreadystatechange = function () {
                    if (script.readyState === 'loaded' || script.readyState === 'complete') {
                        script.onreadystatechange = null;
                        resolve(script);
                    }
                };
            });
        }
        else {
            return new Promise((resolve, reject) => {
                script.onerror = function (e) {
                    reject(null);
                };

                script.onload = function () {
                    resolve(script);
                };
            });
        }
    }

    /**
     * 動的に設定したjsのscriptタグを外す
     * ※ロードしたjsのデータはメモリにきっちり残るのでタグを外して意味がない
     * @param {*} script 
     */
    this.unloadScript = function (script) {
        document.getElementsByTagName('head')[0].removeChild(script);
    }

    // クラス名からクラス定義を返す
    this.getClass = function (className) {
        return Function('return (' + className + ')')();
    }

    /**
     * オブジェクト解放(クラス、配列などの参照型が対象, 文字列型は解放されない)
     * @param {*} obj 
     */
    this.freeObject = function (obj) {
        if (obj == null)
            return;

        obj = void 0;
        obj = null;
    }
}

// 共通モジュールの参照クラス
const common_module = new common();