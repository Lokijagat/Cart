# Mixmach — App Store submission kit

Is file me Partner Dashboard me paste karne ka saara text hai. Shopify ke fields me jo text jaata hai wo English me hai. Baaki notes Hindi me hain.

Partner Dashboard → Apps → Mixmach → **Distribution → Shopify App Store** → **Create listing**.

---

## 1. App setup (submit karne se pehle)

| Kya | Value / note |
| --- | --- |
| Distribution | **Public (Shopify App Store)**. Ye choice baad me badli nahi ja sakti. |
| App URL | `https://app.gbasket.in` (`shopify.app.toml` se, deploy ke saath set hota hai) |
| Redirect URL | `https://app.gbasket.in/auth/callback` |
| Compliance webhooks | `customers/data_request`, `customers/redact`, `shop/redact` (toml me hain, deploy ke saath set honge) |
| App icon | 1200×1200 px, PNG ya JPG. Shopify ka logo ya trademark use mat kijiye. |
| API contact email | lokpal011@gmail.com |
| Emergency developer contact | Partner Dashboard → Settings me apna phone aur email daaliye. Ye zaroori hai (req 4.5.6). |
| Pricing | **Free**. Koi billing code nahi chahiye. |

---

## 2. Listing text (copy-paste)

### App name (max 30 chars)
```
Mixmach
```

### App card subtitle
```
Bundle deals, cart offer banners and a spend progress bar
```

### App introduction (max 100 chars)
```
Bundle deals, cart offer banners and a spend-to-save progress bar can grow your average order value.
```

### App details (max 500 chars)
```
Mixmach adds three ways to encourage bigger carts. Create bundle deals that sell any set number of products from a collection for one price. Show your own offer banners in the cart drawer and on the cart page. Add a progress bar that shows shoppers how much more to spend to unlock order discounts or free shipping. Discounts are created as native Shopify discounts and apply at checkout. Bundle pricing is exact when all products in the collection share the same price.
```

### Feature list (max 80 chars each)
```
Bundle deals: any N products from a collection for one fixed price
Custom offer banners in the cart drawer and on the cart page
Progress bar with spend tiers for order discounts and free shipping
Works with native Shopify discounts at checkout
Add to your theme in a few clicks with the theme editor
```

### Category (suggestion)
- Primary: **Discounts**
- Secondary (agar option ho): **Upsell and cross-sell**

### Privacy policy URL
```
https://app.gbasket.in/privacy
```

### Support
- Support email: `lokpal011@gmail.com`
- FAQ (optional, listing me daal sakte hain):
  - **Do I need to edit theme code?** No. Use the setup buttons on the Mixmach home page to add the blocks in the theme editor.
  - **Does it work with my other discounts?** Mixmach discounts are set to combine with product, order and shipping discounts.
  - **Is it free?** Yes.

### Demo store URL
Apne dev store ka cart page link dijiye, jaise `https://<your-dev-store>.myshopify.com/cart`. Store par 1 bundle deal, 1 flash offer aur progress bar pehle se on rakhiye. Agar store password-protected hai to password testing instructions me likhiye.

### Screenshots (1600×900 px, 3–6)
Browser ka address bar aur desktop crop kar dijiye. Har screenshot alag feature dikhaye. Alt text bhi daaliye.

| # | Kya dikhana hai | Alt text |
| --- | --- | --- |
| 1 | App home: setup steps + bundle discounts table | Mixmach home with theme setup steps and bundle discounts list |
| 2 | Create Discount form (collection, quantity, bundle price) | Creating a bundle deal for three products at one price |
| 3 | Storefront cart drawer with flash offer banner + progress bar | Cart drawer showing an offer banner and spend progress bar |
| 4 | Progress Bar settings (tiers + free shipping threshold) | Progress bar settings with spend tiers and free shipping |
| 5 | Cart page with bundle discount applied | Cart page with the bundle discount applied |

### Feature media (optional)
2–3 minute ka promo video, ya ek 1600×900 feature image. Isme screencast 25% se zyada nahi hona chahiye. Ye optional hai; agar skip karein to ek simple feature image daal dijiye.

---

## 3. Testing instructions (reviewer ke liye, copy-paste)

```
Mixmach is free and needs no external account or login.

Setup
1. Install the app. You land on the Mixmach home page.
2. Under "Set up Mixmach in your theme", click "Turn on drawer embed". In the theme editor, make sure "Mixmach Drawer Offers" is on under App embeds, then click Save.
3. Back in the app, click "Add flash offers block" and "Add progress bar block". Each opens the cart template with the block added. Click Save.

Test 1: Bundle deal
1. Click "Create Discount".
2. Enter a name, choose a collection whose products have the same price, choose quantity 3 and enter a bundle price lower than 3 x the product price. Set Status to Active and save.
3. Expected: the discount appears in the list as ACTIVE and in Shopify admin > Discounts.
4. On the storefront, add 3 products from that collection to the cart.
5. Expected: the cart total drops to the bundle price at checkout.

Test 2: Flash offer banner
1. Go to Flash Offers > create an offer. Enter a message, keep "Show on cart drawer" and "Show on cart page" on, turn on "Enabled" and save.
2. Expected: the banner appears in the cart drawer and on the /cart page. If there are several enabled offers, they rotate.

Test 3: Progress bar
1. Go to Progress Bar. Turn on "Enabled", add a tier (for example spend 1000, get 10% off) and an optional free shipping threshold, then save.
2. Expected: the cart drawer and cart page show how much more to spend for the next reward. When the cart reaches a tier, the order discount applies at checkout.

Uninstall
Uninstalling removes the store's session right away. All other store data is deleted when Shopify sends the shop/redact webhook.
```

Agar demo store password-protected hai, to upar ke text me ek line jod dijiye: `Storefront password: ...`

---

## 4. Screencast script (English, 3–5 minutes)

Shopify ki requirement (4.5.3): video English me ho ya English subtitles ho, aur install se lekar saare features chalte hue dikhe. Loom ya OBS se record karke YouTube (unlisted) ya Loom ka link dijiye.

| Time | Screen pe kya karein | Kya bolein / caption |
| --- | --- | --- |
| 0:00 | Dev store admin → app install | "This is Mixmach. I'm installing it on a development store." |
| 0:20 | OAuth permissions screen → Install | "The app asks only for product read, discounts and app proxy access." |
| 0:35 | App home khulta hai | "After install, the app opens straight to the home page with setup steps." |
| 0:50 | "Turn on drawer embed" → theme editor → Save | "One click turns on the cart drawer embed. No theme code changes." |
| 1:10 | "Add flash offers block" + "Add progress bar block" → Save | "These add the cart page blocks." |
| 1:35 | Create Discount: collection, 3 products, bundle price, Active | "A bundle deal: any 3 products from this collection for one price." |
| 2:05 | Storefront: 3 products cart me → checkout total | "At checkout the bundle price is applied." |
| 2:35 | Flash Offers → create → enabled | "Flash offers show the merchant's own message in the cart." |
| 2:55 | Storefront cart drawer + /cart page me banner | "Here it is in the drawer and on the cart page." |
| 3:15 | Progress Bar → tier + free shipping → save | "The progress bar shows how much more to spend for a reward." |
| 3:40 | Cart me items add karke bar update + checkout discount | "When the cart reaches the tier, the discount applies at checkout." |
| 4:05 | Shopify admin → Discounts me Mixmach ke discounts | "All discounts are native Shopify discounts the merchant can see." |
| 4:20 | End | "That's Mixmach." |

---

## 5. Submission checklist

Order me kijiye:

- [ ] Server par `SCOPES=read_products,write_discounts,write_app_proxy` set karke latest `main` redeploy kiya
- [ ] `shopify app deploy --allow-updates --allow-deletes` chala diya (naye scopes, webhooks, extension changes release)
- [ ] `https://app.gbasket.in/privacy` browser me khul raha hai
- [ ] Naye dev store par fresh install karke Test 1–3 khud chalaye, sab pass hue
- [ ] Uninstall → reinstall karke dekha: app seedha OAuth par jaata hai aur phir home khulta hai
- [ ] Storefront speed: theme extension on karne se pehle aur baad Lighthouse chalaya, score 10 points se zyada nahi gira
- [ ] App icon 1200×1200 upload kiya
- [ ] Listing ke saare fields upar ke text se bhare
- [ ] 3–6 screenshots (1600×900) + alt text upload kiye
- [ ] Testing instructions paste kiye
- [ ] Screencast ka link daala
- [ ] Emergency developer contact daala
- [ ] Partner Dashboard me **Submit for review** dabaya

Review me kuch din se kuch hafte lagte hain. Shopify koi issue bhejta hai to email aata hai. Fix karke wahi listing dobara submit kar sakte hain.
