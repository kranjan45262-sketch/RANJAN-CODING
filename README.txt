Is folder me apni images yahan naam se daalein:

- owner-placeholder.jpg   -> Chanchala Sinha ji ya shop ki photo
- product-bread.jpg
- product-cakes.jpg
- product-puffs.jpg
- product-cookies.jpg
- product-buns.jpg
- product-snacks.jpg
- product-rusk.jpg
- product-muffins.jpg
- product-biscuits.jpg
- bulk-orders.jpg
- gallery-1.jpg to gallery-6.jpg
- hero-bg.jpg (optional, hero section ke background ke liye)

Bas exact isi naam se image save karein, website automatically use kar legi.

SUPABASE SETUP (customer login + cloud orders)
-----------------------------------------------
Yeh project static HTML/JS hai, isliye Next.js ke page.tsx/middleware.ts ki zaroorat nahi hai.
1. Supabase Dashboard > SQL Editor me supabase-setup.sql ek baar run karein.
2. SQL file ki owner policy me apna owner email replace karein.
3. Authentication > Providers me Email enable karein.
4. Supabase-config.js me project URL aur publishable key set karein.
5. Site reload karke customer account banayein. Orders Supabase ke orders/order_items tables me milenge.
6. Owner account verify hone ke baad SQL Editor me admin role statement run karein. Isse website ke `#manage-orders` section me Product Admin panel unlock hoga.

PRODUCT ADMIN
-------------
Owner login ke baad `#manage-orders` par Manage products panel dikhega. Yahin se product name, price, image path, description, active visibility aur stock status add/edit/delete karein. Public product cards ab Supabase ke `products` table se load hote hain; frontend me product catalog hardcoded nahi hai.

IMPORTANT: Publishable/anon key browser me rakhna theek hai. Service-role key kabhi website me na daalein.

PUBLIC DEPLOYMENT
-----------------
Quickest: poora folder Netlify Drop par drag-and-drop karein. Aapko public *.netlify.app URL milega.
Better updates: folder ko GitHub repository me push karke Netlify ya Vercel se connect karein; har push ke baad site update hogi.
Custom domain: hosting dashboard me apna domain add karke DNS records set karein.

PRICE UPDATE
------------
Frontend me pricing hardcoded nahi hai. Owner login karke `#manage-orders` ke Product Admin panel me price edit karein. Isse product card, cart total, UPI amount aur WhatsApp order summary automatically update ho jayega.
