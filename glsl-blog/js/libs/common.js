/**
 * 共通処理群
 * よく使われる処理をまとめた or 最初に実行しないといけない処理
 */
// プラウザのデバッグコンソールを環境に応じて出力させないようにしている
(function () {
    let loca = location,
        host = loca.host,
        // console結果を出力するドメイン名を指定（後方一致）
        consoleDomains = ['localhost', '127.0.0.1', 'local'];

    /**
     * コンソールを利用できるか
     */
    function isConsole() {
        // ローカルファイルを呼び出している場合は
        if (loca.protocol === 'file:')
            return true;

        // 末尾の名前を見て一致しているのがあればコンソール利用可能
        let is = false;
        consoleDomains.some(function (domain) {
            if (host.slice(-domain.length) === domain) {
                is = true;
                return true;
            }
        });

        return is;
    }

    for (var key in console) {
        if (typeof console[key] === 'function') {
            override(key);
        }
    }

    // コンソールで呼び出されたメソッドをオーバーライド
    function override(key) {
        let proto = console[key];
        console[key] = function () {
            if (isConsole()) {
                proto.apply(this, arguments);
            }
        };
    }
})();

function common() {
    /**
    * URLで指定したjavascriptファイルをロード/アンロードする
    * @param {*} url 
    */
    this.loadScript = function (url) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;

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

    /**
     * エラーが発生通知
     */
    this.noticeError = function (obj) {
        // objの型をチェックして型に応じてエラー処理を分岐
        if (this.isObjectType(String.name, obj)) {
            throw new Error(obj);
        }

        if (this.isObjectType(Error.name, obj)) {
            throw obj;
        }
    }

    /**
     * オブジェクトタイプを文字列で判別
     * 存在する型について下記をみよう
     * https://qiita.com/south37/items/c8d20a069fcbfe4fce85
     */
    this.isObjectType = function (type, obj) {
        let clas = Object.prototype.toString.call(obj).slice(8, -1);
        return obj !== undefined && obj !== null && clas === type;
    }

    /**
     * 16進数文字列をRGB(0.0 - 1.0)として変換して出力
     */
    this.converHEXToRGB = function (hex) {
        if (hex.slice(0, 1) == "#") hex = hex.slice(1);
        if (hex.length == 3) hex = hex.slice(0, 1) + hex.slice(0, 1) + hex.slice(1, 2) + hex.slice(1, 2) + hex.slice(2, 3) + hex.slice(2, 3);

        return [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map(function (str) {
            return parseInt(str, 16) / 255.0;
        });
    }

    // 引数の型を名前で返す
    this.typeOf = function(obj) {
        var toString = Object.prototype.toString;
        return toString.call(obj).slice(8, -1).toLowerCase();
    }
}

// 共通モジュールの参照クラス
const common_module = new common();