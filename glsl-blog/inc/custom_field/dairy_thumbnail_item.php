<?php
/**
 * 投稿タイプ「日記」のサムネイルカスタムフィールドの項目オブジェクト
 */
class DairyThumbnailItem
{
    private $thumbnail_id = '';
    private $thumbnail_data = 0;

    private $webgl_canvas_id = '';
    private $webgl_canvas_data = '';

    private $post_id = 0;

    public function get_thumbnail_id()
    {
        return $this->thumbnail_id;
    }
    public function get_webgl_canvas_id()
    {
        return $this->webgl_canvas_id;
    }

    public function get_thumbnail_data()
    {
        return $this->thumbnail_data;
    }
    public function get_webgl_canvas_data()
    {
        return $this->webgl_canvas_data;
    }

    public function is_selected()
    {
        if ($this->thumbnail_data === 0)
            return false;

        return true;
    }

    public function is_thumbnail_selected($thumbnail_data)
    {
        if ($thumbnail_data === '') {
            return false;
        }

        $thumbnail_data_int = (int)$thumbnail_data;
        return $this->thumbnail_data === $thumbnail_data_int;
    }

    public function __construct($no)
    {
        $this->thumbnail_id = 'thumbnail_id_' . $no;
        $this->thumbnail_data = '';

        $this->webgl_canvas_id = 'webgl_canvas_id_' . $no;
        $this->webgl_canvas_data = '';

        $this->post_id = '';
    }

    /**
     * カスタムフィールドデータをロード
     */
    public function load($post_id)
    {
        return $this->loadAndCheckValidate($post_id, null);
    }

    public function loadAndCheckValidate($post_id, $webgl_canvas_data_list)
    {
        $this->post_id = $post_id;

        $new_thumbnail_data = esc_html(get_post_meta($this->post_id, $this->thumbnail_id, true));
        $new_webgl_canvas_data = esc_html(get_post_meta($this->post_id, $this->webgl_canvas_id, true));

        // DBの初期値が''の可能性があるので文字列チェックを追加
        if ($new_thumbnail_data === '')
            return false;

        $new_thumbnail_data = (int)$new_thumbnail_data;
        if ($new_thumbnail_data === 0)
            return false;

        // 値が正常ならクラスプロパティを変える
        $this->thumbnail_data = $new_thumbnail_data;

        // webglのキャンバスリストがあればデータがリストに存在するかチェックする
        // リストになければエラーとする
        if ($webgl_canvas_data_list != null) {
            foreach ($webgl_canvas_data_list as $data) {
                if ($data === $new_webgl_canvas_data) {
                    $this->webgl_canvas_data = $new_webgl_canvas_data;
                    break;
                }
            }
        } else {
            $this->webgl_canvas_data = $new_webgl_canvas_data;
        }

        return true;
    }

    /**
     * カスタムフィールドデータをセーブ
     */
    public function save($post_id, $posts)
    {
        $this->post_id = $post_id;

        $new_thumbnail_data = $posts[$this->thumbnail_id];
        if ($new_thumbnail_data === '') {
            return;
        }

        $this->thumbnail_data = (int)$new_thumbnail_data;
        $this->webgl_canvas_data = $posts[$this->webgl_canvas_id];

        // メディアライブラリのサムネイルIDを更新
        $this->_save($this->thumbnail_data, $this->thumbnail_id);

        // サムネイルIDと関連付けしたWebGLのキャンバスIDを更新
        $this->_save($this->webgl_canvas_data, $this->webgl_canvas_id);
    }

    private function _save($data, $id)
    {
        if (get_post_meta($this->post_id, $id) == '')
            add_post_meta($this->post_id, $id, $data, true);
        elseif ($data != get_post_meta($this->post_id, $id, true))
            update_post_meta($this->post_id, $id, $data);
        elseif ($data == '')
            delete_post_meta($this->post_id, $id, get_post_meta($this->post_id, $id, true));
    }
}
