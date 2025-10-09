export enum ProductSize {
  XS = 'xs',
  S = 's',
  M = 'm',
  G = 'g',
  GG = 'gg',
  XXL = 'xxl',
}

export enum ProductColor {
  BLACK = 'black',
  WHITE = 'white',
  GRAY = 'gray',
  NAVY = 'navy',
  RED = 'red',
  BLUE = 'blue',
}

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
}

export enum ProductCategory {
  REMERA = 'remera',
  PANTALON = 'pantalon',
  CHAQUETA = 'chaqueta',
  ZAPATILLAS = 'zapatillas',
  BOTAS = 'botas',
  SHORTS = 'shorts',
  VESTIDO = 'vestido',
  BLUSA = 'blusa',
}

export enum ProductStyle {
  // Estilos para camisetas/remeras/polos/blusas
  REGULAR = 'regular',
  OVERSIZE = 'oversize',
  SLIM_FIT = 'slim_fit',
  
  // Estilos para pantalones/jeans/shorts
  STRAIGHT = 'straight',
  SKINNY = 'skinny',
  RELAXED = 'relaxed',
  BOOTCUT = 'bootcut',
  
  // Estilos para sudaderas/hoodies/chaquetas
  CLASSIC = 'classic',
  CROPPED = 'cropped',
  OVERSIZED = 'oversized',
  
  // Estilos para calzado
  CASUAL = 'casual',
  FORMAL = 'formal',
  DEPORTIVO = 'deportivo',
  URBANO = 'urbano',
  
  // Estilos para vestidos/faldas
  A_LINE = 'a_line',
  BODYCON = 'bodycon',
  MAXI = 'maxi',
  MINI = 'mini',
  MIDI = 'midi',
}

// Mapeo de categorías a estilos permitidos
export const CATEGORY_STYLE_MAP: Record<ProductCategory, ProductStyle[]> = {
  [ProductCategory.REMERA]: [ProductStyle.REGULAR, ProductStyle.OVERSIZE, ProductStyle.SLIM_FIT],
  [ProductCategory.BLUSA]: [ProductStyle.REGULAR, ProductStyle.OVERSIZE, ProductStyle.SLIM_FIT],
  
  [ProductCategory.PANTALON]: [ProductStyle.STRAIGHT, ProductStyle.SKINNY, ProductStyle.RELAXED, ProductStyle.BOOTCUT],
  [ProductCategory.SHORTS]: [ProductStyle.STRAIGHT, ProductStyle.SKINNY, ProductStyle.RELAXED],
  
  [ProductCategory.CHAQUETA]: [ProductStyle.CLASSIC, ProductStyle.CROPPED, ProductStyle.OVERSIZED],
  
  [ProductCategory.ZAPATILLAS]: [ProductStyle.CASUAL, ProductStyle.DEPORTIVO, ProductStyle.URBANO],
  [ProductCategory.BOTAS]: [ProductStyle.CASUAL, ProductStyle.FORMAL, ProductStyle.URBANO],
  
  [ProductCategory.VESTIDO]: [ProductStyle.A_LINE, ProductStyle.BODYCON, ProductStyle.MAXI, ProductStyle.MINI, ProductStyle.MIDI],
};