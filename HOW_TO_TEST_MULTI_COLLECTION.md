# 🧪 How to Test Multi-Collection Features

## The Problem
You deployed the app but everything looks the same because **you only have watch collections**. The multi-collection features only appear when you create **sneaker** or **purse** collections!

---

## ✅ What to Look For

### 1. **Create New Collection Button**
When you click "Create New Collection", you should see **3 collection type options**:

```
⌚ Watches
   Track your watch collection with movement, case size, and water resistance details

👟 Sneakers
   Catalog your sneaker collection with colorway, size, and condition tracking

👜 Purses
   Manage your purse collection with material, authenticity, and hardware details
```

### 2. **Collection Switcher**
In the top-right (desktop) or header (mobile), you should see a dropdown showing:
- Collection icon (⌚/👟/👜)
- Collection name
- Collection type label
- Your role (owner/editor/viewer)

### 3. **Dynamic Dashboard**
When you switch to a **sneaker collection**, you should see:
- "Sneakers" instead of "Watches" labels
- "Colorway" instead of "Dial Color"
- "Silhouette" instead of "Type"
- **Sneaker Stats Cards**:
  - Condition Breakdown (Deadstock, VNDS, Used, Worn)
  - Box Included %
  - OG All %
  - Limited Editions
  - Top Collaboration

When you switch to a **purse collection**, you should see:
- "Purses" instead of "Watches" labels
- "Color" instead of "Dial Color"
- "Style" instead of "Type"
- **Purse Stats Cards**:
  - Top Material
  - Authenticity Verified %
  - Most Common Size
  - Dust Bags
  - Authenticity Cards

---

## 🧪 Step-by-Step Testing Guide

### Step 1: Check Your Current Collections
1. Open the app in your browser
2. Look at the **Collection Switcher** (top-right on desktop, header on mobile)
3. Click it to see all your collections
4. **Question**: Do you see a "Create New Collection" button?

### Step 2: Create a Sneaker Collection
1. Click **"Create New Collection"**
2. Select the **👟 Sneakers** option (should have Footprints icon)
3. Name it something like "My Sneakers" or "Kicks Collection"
4. Click **"Create Collection"**

### Step 3: Switch to Your Sneaker Collection
1. Click the **Collection Switcher** dropdown
2. Select your new sneaker collection
3. **Watch what happens**:
   - Dashboard should update
   - Labels change from "Watches" → "Sneakers"
   - Stats change from watch-specific → sneaker-specific
   - Bottom nav Collection icon might change (if implemented)

### Step 4: Add a Sneaker to Test
1. Go to **Collection** page
2. Click **"Add New Sneaker"** (not "Add New Watch")
3. Fill out the form - notice sneaker-specific fields:
   - **Colorway** (instead of Dial Color)
   - **Silhouette** (instead of Type)
   - **Condition** (Deadstock, VNDS, Used, Worn)
   - **Shoe Size** with size type (US/UK/EU/CM)
   - **SKU / Style Code**
   - **Box Included** checkbox
   - **OG All** checkbox
   - **Limited Edition** checkbox
   - **Collaboration** text field
4. Add the sneaker and see it in your collection

### Step 5: View Sneaker-Specific Stats
1. Go back to **Dashboard**
2. Scroll down - you should see **Sneaker Stats Cards** showing:
   - Condition breakdown pie chart or bars
   - Box included percentage
   - Limited edition count
   - Top collaboration (if you added one)

### Step 6: Create a Purse Collection (Optional)
1. Repeat steps 2-5 but select **👜 Purses**
2. Notice purse-specific fields:
   - **Color** (main color)
   - **Material** (leather, canvas, etc.)
   - **Size Category** (mini/small/medium/large/oversized)
   - **Hardware Color**
   - **Authenticity Verified** checkbox
   - **Serial Number**
   - **Dust Bag Included** checkbox
   - **Authenticity Card Included** checkbox
   - **Strap Type** (fixed/removable/adjustable/chain/none)

### Step 7: Switch Between Collections
1. Use the **Collection Switcher** to jump between:
   - Your watch collection
   - Your sneaker collection
   - Your purse collection
2. **Notice how the entire UI adapts**:
   - Different icons
   - Different labels
   - Different stats
   - Different terminology

---

## 🔍 Where to Look for Changes

### Header/Top Bar
- **Collection Switcher** shows current collection type icon + name
- Icon changes: ⌚ → 👟 → 👜

### Dashboard
- **Page subtitle** changes:
  - "Overview of your watches collection statistics"
  - "Overview of your sneakers collection statistics"
  - "Overview of your purses collection statistics"
- **Stats labels** change:
  - "Total Watches" → "Total Sneakers" → "Total Purses"
  - "Most Worn Watch" → "Most Worn Sneaker" → "Most Carried Purse"
  - "Avg Days/Watch" → "Avg Days/Sneaker" → "Avg Days/Purse"
- **Collection-specific stats** appear:
  - Watches: Dial Color, Movement, Water Usage
  - Sneakers: Condition Breakdown, Box %, Limited Editions
  - Purses: Materials, Authenticity %, Sizes

### Collection Page
- **Search placeholder** changes:
  - "Search watches..."
  - "Search sneakers..."
  - "Search purses..."
- **Add button** changes:
  - "Add New Watch"
  - "Add New Sneaker"
  - "Add New Purse"
- **Empty state** changes:
  - "No watches yet"
  - "No sneakers yet"
  - "No purses yet"

### Mobile Bottom Tabs
- Collection tab icon **might** change (if implemented)
- Currently uses Watch icon by default

---

## 📊 Database Check (For Developers)

If you want to verify the database has multi-collection support, run:

```sql
-- Check if collection_type enum exists
SELECT enum_range(NULL::collection_type);
-- Should return: {watches,sneakers,purses}

-- Check your collections
SELECT id, name, collection_type, created_at
FROM collections
WHERE created_by = 'YOUR_USER_ID';

-- Check if sneaker_specs table exists
SELECT COUNT(*) FROM sneaker_specs;

-- Check if purse_specs table exists
SELECT COUNT(*) FROM purse_specs;
```

---

## ❓ Troubleshooting

### "I don't see the Create Collection button"
- You might have already created a collection
- Only non-admin users can create 1 collection (owner)
- Admin users can create unlimited collections

### "I don't see collection type options when creating"
- Make sure you're using the latest deployed version
- Check browser console for errors
- Verify database migration ran: `collection_type` enum should exist

### "Everything still shows 'Watches' even in sneaker collection"
- Check that you **switched to the sneaker collection** using the Collection Switcher
- Refresh the page
- Check browser console for errors
- Verify the collection was created with `collection_type = 'sneakers'`

### "I don't see Sneaker Stats Cards"
- You need to **add sneakers** to your sneaker collection first
- The stats only appear when you have items in the collection
- Make sure you filled out the sneaker-specific fields (condition, box, etc.)

---

## 🎯 Quick Verification Checklist

- [ ] I can create a new collection
- [ ] I see 3 collection type options (watches/sneakers/purses)
- [ ] I created a sneaker collection
- [ ] I switched to my sneaker collection using Collection Switcher
- [ ] Dashboard labels changed to "Sneakers"
- [ ] I can add a new sneaker with sneaker-specific fields
- [ ] I see Sneaker Stats Cards on Dashboard
- [ ] Collection page says "Add New Sneaker" (not "Add New Watch")
- [ ] Search placeholder says "Search sneakers..."
- [ ] I can switch back to my watch collection and see watch labels again

---

## 🚀 What You Should See

### Before (Watch Collection)
```
Dashboard
Overview of your watches collection statistics

📊 Total Watches: 5
⌚ Most Worn Watch: Rolex Submariner
📅 Avg Days/Watch: 12.4
🎨 Most Worn Dial Color: Black
🏷️ Most Worn Type: Diver
```

### After (Sneaker Collection)
```
Dashboard
Overview of your sneakers collection statistics

📊 Total Sneakers: 3
👟 Most Worn Sneaker: Nike Dunk Low
📅 Avg Days/Sneaker: 8.2
🎨 Most Worn Colorway: Panda
🏷️ Most Worn Silhouette: Basketball

[Sneaker Stats Cards]
Condition Breakdown:
• Deadstock: 1
• VNDS: 1
• Used: 1

Box Included: 66%
OG All: 33%
Limited Editions: 1
```

---

## 📝 Summary

**To see multi-collection features working:**

1. ✅ **Create** a sneaker or purse collection (not just watch)
2. ✅ **Switch** to that collection using Collection Switcher
3. ✅ **Add items** to the collection
4. ✅ **View Dashboard** to see type-specific stats
5. ✅ **Switch back** to watch collection to see it change again

**The features ARE there** - you just need to create and switch to different collection types to see them! 🎉

---

**Questions?** Check the browser console for errors or verify database migrations ran successfully.
