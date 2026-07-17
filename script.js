/* ================================================================
   CHANCHALA GOLDEN CRUST - SCRIPT.JS
   ================================================================
   Yeh file website ko interactive banati hai:
   1. Mobile menu (hamburger) open/close
   2. Header par scroll effect
   3. Scroll-to-top button
   4. Contact form ko WhatsApp par bhejna
   5. Footer me current year automatically dikhana

   Beginner ke liye: har section ke upar comment me bataya gaya
   hai ki wo code kya karta hai.
   ================================================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* ------------------------------------------------------------
     1. MOBILE MENU TOGGLE
     Jab user hamburger icon par click karega, menu khulega/band hoga
     ------------------------------------------------------------ */
  const hamburger = document.getElementById('hamburger');
  const mainNav = document.getElementById('main-nav');

  hamburger.addEventListener('click', function () {
    hamburger.classList.toggle('open');
    mainNav.classList.toggle('open');
  });

  // Jab user kisi nav link par click kare, mobile menu apne aap band ho jaaye
  const navLinks = mainNav.querySelectorAll('a');
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      hamburger.classList.remove('open');
      mainNav.classList.remove('open');
    });
  });

  /* ------------------------------------------------------------
     2. SCROLL TO TOP BUTTON
     Jab user thoda scroll kare, "upar jaayein" button dikhega
     ------------------------------------------------------------ */
  const scrollTopBtn = document.getElementById('scroll-top');

  window.addEventListener('scroll', function () {
    if (window.scrollY > 400) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  });

  scrollTopBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ------------------------------------------------------------
     3. FOOTER CURRENT YEAR
     Copyright line me har saal khud-ba-khud sahi year dikhega
     ------------------------------------------------------------ */
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  /* ------------------------------------------------------------
     4. CONTACT FORM -> WHATSAPP
     ------------------------------------------------------------
     IMPORTANT (zaroor padhein):
     Yeh ek simple HTML form hai. Browser khud kisi ko email
     bhej nahi sakta, isliye yahan hum form ki details ko
     WhatsApp message me convert karke seedha aapke WhatsApp
     number (9973052333) par bhej dete hain.

     Agar aap chahte hain ki form directly EMAIL par bhi jaaye,
     to aapko kisi free service jaise:
       - Web3Forms (https://web3forms.com)
       - Formspree (https://formspree.io)
     ka istemal karna hoga. Wahan free account banake ek
     "access key" milegi, jise aap is code me daal sakte hain.
     Filhaal simplicity ke liye hum WhatsApp use kar rahe hain.
     ------------------------------------------------------------ */
  const contactForm = document.getElementById('contact-form');
  const formNote = document.getElementById('form-note');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault(); // form ko normal reload hone se roka

      const name = document.getElementById('name').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const message = document.getElementById('message').value.trim();

      if (!name || !phone || !message) {
        formNote.textContent = 'Kripya sabhi fields bharen.';
        return;
      }

      // WhatsApp business number (jo aapne diya hai)
      const whatsappNumber = '919973052333';

      // Message ko WhatsApp ke liye taiyar karna
      const whatsappText =
        'Namaste, main ' + name + ' hoon.%0A' +
        'Phone: ' + phone + '%0A' +
        'Message: ' + message;

      const whatsappURL = 'https://wa.me/' + whatsappNumber + '?text=' + whatsappText;

      formNote.textContent = 'Aapko WhatsApp par redirect kiya ja raha hai...';

      // Naye tab me WhatsApp kholna
      window.open(whatsappURL, '_blank');

      // Form reset kar dena
      contactForm.reset();
    });
  }

  /* ------------------------------------------------------------
     5. SIMPLE SCROLL REVEAL ANIMATION (optional visual polish)
     Cards jab screen par visible hote hain, halka sa fade-in
     hote hain. Isse page thoda premium feel deta hai.
     ------------------------------------------------------------ */
  const revealItems = document.querySelectorAll(
    '.product-card, .why-card, .testimonial-card, .gallery-item, .trust-badge'
  );

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    revealItems.forEach(function (item) {
      item.style.opacity = '0';
      item.style.transform = 'translateY(24px)';
      item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(item);
    });
  }

});
