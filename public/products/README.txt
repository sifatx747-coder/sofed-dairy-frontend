পণ্যের ছবি (Homepage product photos)
====================================

এখন হোমপেজের পণ্য কার্ডে প্লেসহোল্ডার অনলাইন ছবি ব্যবহার হচ্ছে
(Unsplash + Wikimedia) — app/page.jsx এর PRODUCTS তালিকায় img URL দেওয়া আছে।

নিজের আসল ছবি দিতে দুটি উপায়:

1) সহজ: app/page.jsx এ প্রতিটি পণ্যের img: '...' এ নিজের ছবির লিংক বসান।

2) লোকাল ফাইল: এই ফোল্ডারে (client/public/products/) ছবি রাখুন এবং
   app/page.jsx এ img এর মান নিচের মতো পথ দিন —

       dudh.jpg        →  খাঁটি দুধ      →  img: '/products/dudh.jpg'
       misti-doi.jpg   →  মিষ্টি দই      →  img: '/products/misti-doi.jpg'
       tok-doi.jpg     →  টক দই         →  img: '/products/tok-doi.jpg'
       cup-doi.jpg     →  কাপ দই        →  img: '/products/cup-doi.jpg'
       ghee.jpg        →  ঘি            →  img: '/products/ghee.jpg'

টিপস:
- চারকোনা/চওড়া ছবি ভালো; কার্ডে object-cover হিসেবে বসে, তাই মাঝের অংশ গুরুত্বপূর্ণ।
- ~800x800px যথেষ্ট; png/webp ও চলবে।
- ছবি লোড না হলে কার্ডে বাংলা অক্ষর-টাইল (দু, মি, ট, কা, ঘ) দেখাবে — ভাঙা ছবি নয়।
