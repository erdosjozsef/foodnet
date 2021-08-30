(function ($) {
  "use strict";

  /*========= Costic Framework ===========*/
  var CosticFramework = (function () {
    /* Initialize all required functions */
    function init() {
      setActiveMenuItem();
      customToggleActions();
    }

    /* Sets the active class to the currently viewed page */
    function setActiveMenuItem() {
      var current = location.pathname
        .split("/")
        .slice(-1)[0]
        .replace(/^\/|\/$/g, "");
      $(".ms-main-aside .menu-item a", $("#ms-side-nav")).each(function () {
        var $this = $(this);
        if (current === "" || current === "/") {
          //for root url
          if ($this.attr("href").indexOf("/") !== -1) {
            $(this).addClass("active");
            $(this).parents(".collapse").prev().addClass("active");
            if ($(this).parents(".collapse").length) {
              $(this).closest(".collapse").addClass("show");
            }
          }
        } else {
          //for other url
          if ($this.attr("href").indexOf(current) !== -1) {
            $(this).addClass("active");
            $(this).parents(".collapse").prev().addClass("active");
            if ($(this).parents(".collapse").length) {
              $(this).closest(".collapse").addClass("show");
            }
          }
        }
      });
    }

    /*  Custom Toggle Actions */
    function customToggleActions() {
      $(".ms-toggler").bind("click", function () {
        var target = $(this).data("target");
        var toggleType = $(this).data("toggle");

        switch (toggleType) {
          //Aside Left
          case "slideLeft":
            $(target).toggleClass("ms-aside-open");
            $(".ms-aside-overlay.ms-overlay-left").toggleClass("d-block");
            $("body").toggleClass("ms-aside-left-open");
            break;
          // Aside Right
          case "slideRight":
            $(target).toggleClass("ms-aside-open");
            $(".ms-aside-overlay.ms-overlay-right").toggleClass("d-block");
            break;
          // Navbar Slide down
          case "slideDown":
            $(target).toggleClass("ms-slide-down");
            break;
          // Quick bar
          case "hideQuickBar":
            quickBarReset();
            break;
          default:
            return;
        }
      });
    }

    return {
      init: init,
    };
  })();

  CosticFramework.init();
})(jQuery);
