<?php
/**
 * The template for displaying the footer
 *
 * Contains the closing of the #content div and all content after.
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package glsl-blog
 */

?>
  <!-- Footer -->
  <footer id="colophon" class="py-5 bg-black js_dairy_view" style="display: block;">
    <div class="container">
      <p class="m-0 text-center text-white small">Copyright &copy; tonakaiJP 2021</p>
    </div>
    <!-- /.container -->
  </footer>
</div><!-- #page -->

  <!-- Bootstrap core JavaScript -->
  <script src="<?php echo get_template_directory_uri(); ?>/vendor/jquery/jquery.min.js"></script>
  <script src="<?php echo get_template_directory_uri(); ?>/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>

  <!-- #weggl controller javascript -->
  <?php // WegGL制御コード ?>
  <script src="<?php echo get_template_directory_uri() ?>/js/libs/common.js"></script>
  <script src="<?php echo get_template_directory_uri() ?>/js/app_model.js"></script>
  <script>
    var g_app_model = new AppModel("<?php echo get_template_directory_uri()?>");
    <?php foreach (CustomFieldDairyThumbnail::get_canvas_name_list() as $name): ?>
      g_app_model.addCanvasName("<?php echo esc_html($name); ?>");
    <?php endforeach; ?>

  </script>
  <script src="<?php echo get_template_directory_uri() ?>/js/app.js"></script>
  <!-- weggl controller javascript# -->

<?php wp_footer(); ?>

</body>
</html>
