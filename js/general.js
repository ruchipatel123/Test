/*!
Project: RCPA
File: general.js — header, mobile navigation, smooth scroll
*/

var $ = jQuery.noConflict();

var lastScrollTop = 0;

function fixedHeader() {
    var $header = $('.site-header');
    var scrollTop = $(window).scrollTop();

    if (scrollTop > 120 && scrollTop > lastScrollTop && !$('body').hasClass('menu-open')) {
        $header.addClass('is-hidden');
    } else {
        $header.removeClass('is-hidden');
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
}

$(window).on('load resize scroll', fixedHeader);

$(document).ready(function () {
    var $body = $('body');
    var $toggle = $('.menu-toggle');
    var $backdrop = $('.nav-backdrop');

    $backdrop.removeAttr('hidden');

    function openMenu() {
        $body.addClass('menu-open no-scroll');
        $toggle.attr('aria-expanded', 'true');
    }

    function closeMenu() {
        $body.removeClass('menu-open no-scroll');
        $toggle.attr('aria-expanded', 'false').attr('aria-label', 'Open menu');
    }

    $toggle.on('click', function (e) {
        e.preventDefault();
        if ($body.hasClass('menu-open')) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    $backdrop.on('click', closeMenu);

    $(document).on('keyup.mobileNav', function (e) {
        if (e.key === 'Escape' && $body.hasClass('menu-open')) {
            closeMenu();
            $toggle.trigger('focus');
        }
    });

    $('.nav-panel a').on('click', closeMenu);

    $('.js-year').text(new Date().getFullYear());

    $("a[href^='#']").not('.skip-link, .screen-reader-text').on('click', function (e) {
        var href = $(this).attr('href');
        if (href && href.length > 1 && $(href).length) {
            e.preventDefault();
            var offset = $('.site-header').outerHeight() || 90;
            $('html, body').animate({ scrollTop: $(href).offset().top - offset }, 700);
        }
    });
});
