export interface Product {
  id: string;
  slug: string;
  name: string;
  category: 'gents' | 'ladies' | 'unisex' | 'accessories';
  price: number;
  compareAtPrice?: number;
  img: string;
  hoverImg?: string;
  gallery?: string[];
  badge?: string;
  isNew?: boolean;
  sold?: number;
  sizes: string[];
  description: string;
}

/**
 * Full catalog scraped from mkurugenzi.ke (the official store).
 * All images are the local copies already present in /public/assets/images.
 */
export const PRODUCTS: Product[] = [
  {
    id: '1',
    slug: 'socks-a-pack-of-3',
    name: 'Socks – A Pack Of 3',
    category: 'unisex',
    price: 1000,
    img: '/assets/images/Mkurugenzi – Merch/87047815-30b6-46c8-881f-30520e5d72ea-1-600x900.png',
    hoverImg: '/assets/images/Mkurugenzi – Merch/Socks-pair-550x660.png',
    gallery: [
      '/assets/images/Mkurugenzi – Merch/87047815-30b6-46c8-881f-30520e5d72ea-1-600x900.png',
      '/assets/images/Mkurugenzi – Merch/Socks-pair-550x660.png',
      '/assets/images/Mkurugenzi – Merch/8e48cf97-e2cb-454a-8333-696d7f143826-550x660.png',
    ],
    badge: 'New',
    isNew: true,
    sold: 67,
    sizes: ['S', 'M', 'L'],
    description:
      'The signature Mkurugenzi crew socks in a convenient pack of 3. Heavy rib-knit cotton with arched support and jacquard Mkurugenzi branding — built for everyday wear.',
  },
  {
    id: '2',
    slug: 'unisex-sweat-suits-black',
    name: 'Sweatsuits – Black Excellence',
    category: 'unisex',
    price: 6500,
    img: '/assets/images/Mkurugenzi – Merch/290-600x840.jpg',
    hoverImg: '/assets/images/Mkurugenzi – Merch/290-550x660.jpg',
    badge: 'Popular',
    sold: 54,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    description:
      'The iconic Mkurugenzi sweatsuit in deep black. Heavyweight premium fleece with a tailored drop-shoulder cut, deep elastic cuffs and high-density chest embroidery.',
  },
  {
    id: '3',
    slug: 'unisex-sweat-suits-sand',
    name: 'Sweatsuits – Ivory Essence',
    category: 'unisex',
    price: 6500,
    img: '/assets/images/Mkurugenzi – Merch/342-600x840.jpg',
    hoverImg: '/assets/images/Mkurugenzi – Merch/342-550x660.jpg',
    sold: 38,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    description:
      'Warm ivory-toned heavyweight sweatsuit with subtle tone-on-tone embroidery. The perfect blend of minimal luxury and everyday comfort.',
  },
  {
    id: '4',
    slug: 'unisex-sweat-suits-brown',
    name: 'Sweatsuits – Coffee Brown',
    category: 'unisex',
    price: 6500,
    img: '/assets/images/Mkurugenzi – Merch/309-600x840.jpg',
    hoverImg: '/assets/images/Mkurugenzi – Merch/309-550x660.jpg',
    sold: 31,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    description:
      'Rich coffee-brown sweatsuit cut from custom heavyweight fleece. Features a boxy silhouette, ribbed hem and the signature Mkurugenzi chest logo.',
  },
  {
    id: '5',
    slug: 'ladies-sweat-suits-light-grey',
    name: 'Ladies Sweatsuits – Soft Grey',
    category: 'ladies',
    price: 6750,
    img: '/assets/images/Mkurugenzi – Merch/395-600x840.jpg',
    hoverImg: '/assets/images/Mkurugenzi – Merch/395-550x660.jpg',
    sold: 42,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description:
      'The ladies sweatsuit in a soft grey finish. Tailored for a relaxed feminine fit with cropped zip fleece and high-waisted tapered joggers.',
  },
  {
    id: '6',
    slug: 'ladies-sweat-suits-black',
    name: 'Ladies Sweatsuits – Black Excellence',
    category: 'ladies',
    price: 6750,
    img: '/assets/images/Mkurugenzi – Merch/512-600x840.jpg',
    hoverImg: '/assets/images/Mkurugenzi – Merch/512-550x660.jpg',
    badge: 'Hot',
    sold: 61,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description:
      'Midnight black ladies sweatsuit styled for sleek urban aesthetics and luxury comfort. Cropped quarter-zip paired with tapered high-waist joggers.',
  },
  {
    id: '7',
    slug: 'ladies-sweat-suits-burgundy',
    name: 'Ladies Sweatsuits – Burgundy Bliss',
    category: 'ladies',
    price: 6750,
    img: '/assets/images/Mkurugenzi – Merch/476-600x840.jpg',
    hoverImg: '/assets/images/Mkurugenzi – Merch/476-550x660.jpg',
    sold: 47,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description:
      'Vibrant deep-burgundy cotton sweatsuit with high-waisted tapered joggers and a cropped zip fleece. A bold statement in the Mkurugenzi palette.',
  },
  {
    id: '8',
    slug: 'mkurugenzi-jacket',
    name: 'Jacket – Black Icon',
    category: 'gents',
    price: 3500,
    img: '/assets/images/Mkurugenzi – Merch/458-600x900.jpg',
    hoverImg: '/assets/images/Mkurugenzi – Merch/458-550x660.jpg',
    badge: 'Popular',
    sold: 52,
    sizes: ['S', 'M', 'L', 'XL'],
    description:
      'The Black Icon track jacket. Structured high-neck cut with matte black hardware, tailored side piping and the Mkurugenzi crest embroidery.',
  },
  {
    id: '9',
    slug: 'quarter-zip-beige',
    name: 'Quarter Zip – Desert Sand',
    category: 'gents',
    price: 2500,
    img: '/assets/images/Mkurugenzi – Merch/237-1-600x840.jpg',
    hoverImg: '/assets/images/Mkurugenzi – Merch/237-1-550x660.jpg',
    sold: 44,
    sizes: ['S', 'M', 'L', 'XL'],
    description:
      'Heavyweight desert-sand quarter-zip featuring a custom silver zipper pull, ribbed collar and minimal back logo embroidery.',
  },
  {
    id: '10',
    slug: 'quarter-zip-black',
    name: 'Quarter Zip – Black Excellence',
    category: 'gents',
    price: 2500,
    img: '/assets/images/Mkurugenzi – Merch/122-1-1-600x900.jpg',
    hoverImg: '/assets/images/Mkurugenzi – Merch/122-1-1-550x660.jpg',
    sold: 58,
    sizes: ['S', 'M', 'L', 'XL'],
    description:
      'The black quarter-zip — heavyweight cotton fleece with a ribbed collar, deep cuffs and the Mkurugenzi signature embroidery on the chest.',
  },
  {
    id: '11',
    slug: 'beanie-hat-beige',
    name: 'Beanie Hat – Beige',
    category: 'accessories',
    price: 900,
    img: '/assets/images/Mkurugenzi – Merch/Beaniebeige-600x750.webp',
    hoverImg: '/assets/images/Mkurugenzi – Merch/Beaniebeige.webp',
    sold: 36,
    sizes: ['ONE SIZE'],
    description:
      'Thick rib-knit beige beanie featuring the woven Mkurugenzi brand label. Warm, stretchy and built to last.',
  },
  {
    id: '12',
    slug: 'tote-bag-white',
    name: 'Tote Bag – White',
    category: 'accessories',
    price: 850,
    img: '/assets/images/Mkurugenzi – Merch/white-tote-bag-600x750.webp',
    hoverImg: '/assets/images/Mkurugenzi – Merch/white-tote-bag-e1768471281980.webp',
    sold: 29,
    sizes: ['ONE SIZE'],
    description:
      'Clean white canvas tote bag with reinforced handles and the minimal black Mkurugenzi Director print.',
  },
  {
    id: '13',
    slug: 'tote-bag-black',
    name: 'Tote Bag – Black',
    category: 'accessories',
    price: 2500,
    img: '/assets/images/Mkurugenzi – Merch/Tote-Resized-600x750.png',
    hoverImg: '/assets/images/Mkurugenzi – Merch/3.png',
    sold: 22,
    sizes: ['ONE SIZE'],
    description:
      'Heavy canvas black tote with reinforced shoulder handles, inner zip stash pocket and bold Mkurugenzi branding.',
  },
  {
    id: '14',
    slug: 'hoodies-black-excellence',
    name: 'Hoodie – Black Excellence',
    category: 'unisex',
    price: 3000,
    img: '/assets/images/Mkurugenzi – Merch/BlackHoodie-600x750.webp',
    hoverImg: '/assets/images/Mkurugenzi – Merch/BlackHoodie.webp',
    badge: 'Best Seller',
    sold: 73,
    sizes: ['S', 'M', 'L', 'XL'],
    description:
      'Heavyweight luxury fleece hoodie with double-layered hood, pouch pocket and clean boxy structure. The everyday staple.',
  },
  {
    id: '15',
    slug: 't-shirt-makosa-ni-yangu',
    name: 'T-Shirt – Makosa Ni Yangu',
    category: 'unisex',
    price: 1500,
    img: '/assets/images/Mkurugenzi – Merch/blacktshirt_79fe47d5-b4c9-4742-b593-2fa0f86024e8-600x750.webp',
    hoverImg: '/assets/images/Mkurugenzi – Merch/blacktshirt_79fe47d5-b4c9-4742-b593-2fa0f86024e8.webp',
    badge: 'New',
    isNew: true,
    sold: 25,
    sizes: ['S', 'M', 'L', 'XL'],
    description:
      'The statement tee — "Makosa Ni Yangu" print on heavyweight black cotton. Drop shoulders, anti-fading reactive dyes.',
  },
  {
    id: '16',
    slug: 't-shirts-black-excellence',
    name: 'T-Shirt – Black Excellence',
    category: 'unisex',
    price: 1500,
    img: '/assets/images/Mkurugenzi – Merch/black-tshirt-2-600x750.webp',
    hoverImg: '/assets/images/Mkurugenzi – Merch/black-tshirt-2-768x960.webp',
    sold: 66,
    sizes: ['S', 'M', 'L', 'XL'],
    description:
      'Deep black heavyweight tee with the signature Mkurugenzi script on chest and spine. Boxy drop-shoulder fit.',
  },
  {
    id: '17',
    slug: 't-shirt-desert-sand',
    name: 'T-Shirt – Desert Sand',
    category: 'unisex',
    price: 1500,
    img: '/assets/images/Mkurugenzi – Merch/Beige-Tshirt-600x750.webp',
    hoverImg: '/assets/images/Mkurugenzi – Merch/Beige-Tshirt.webp',
    sold: 48,
    sizes: ['S', 'M', 'L', 'XL'],
    description:
      'Heavy combed cotton oversized tee in warm desert sand with high-density chest branding.',
  },
  {
    id: '18',
    slug: 't-shirt-faded-navy',
    name: 'T-Shirt – Faded Navy',
    category: 'unisex',
    price: 1500,
    img: '/assets/images/Mkurugenzi – Merch/tshirt-navy-bluer-1-600x750.webp',
    hoverImg: '/assets/images/Mkurugenzi – Merch/tshirt-navy-bluer-1.webp',
    sold: 33,
    sizes: ['S', 'M', 'L', 'XL'],
    description:
      'Faded navy heavyweight tee engineered with drop shoulders and anti-fading reactive dyes for long-lasting color.',
  },
  {
    id: '19',
    slug: 't-shirt-white-luxe',
    name: 'T-Shirt – White Luxe',
    category: 'unisex',
    price: 1500,
    img: '/assets/images/Mkurugenzi – Merch/White-tshirt-600x750.webp',
    hoverImg: '/assets/images/Mkurugenzi – Merch/White-tshirt.webp',
    sold: 55,
    sizes: ['S', 'M', 'L', 'XL'],
    description:
      'Pristine white cotton tee with the minimal Mkurugenzi black logo print on chest and spine.',
  },
  {
    id: '20',
    slug: 'tshirt-burgundy-bliss',
    name: 'T-Shirt – Burgundy Bliss',
    category: 'unisex',
    price: 1500,
    img: '/assets/images/Mkurugenzi – Merch/Burgundy-Tshirt-600x750.webp',
    hoverImg: '/assets/images/Mkurugenzi – Merch/Burgundy-Tshirt.webp',
    sold: 40,
    sizes: ['S', 'M', 'L', 'XL'],
    description:
      'Deep burgundy heavyweight tee — bold color, boxy drop-shoulder silhouette and the signature Mkurugenzi script.',
  },
];
