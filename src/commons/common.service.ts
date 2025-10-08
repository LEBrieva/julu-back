import { ProductSize, ProductColor } from "src/product/product.enum";


export class CommonService{

    static generateUniqueSku(productName: string, size: ProductSize, color: ProductColor): string {
        const baseSku = this.generateSku(productName, size, color);
        const timestamp = Date.now().toString().slice(-4); // Últimos 4 dígitos
        return `${baseSku}-${timestamp}`;
    }

    private static generateSku(productName: string, size: ProductSize, color: ProductColor): string {
        // Tomar primeras 2 letras de cada palabra del producto
        const productCode = productName
        .split(' ')
        .map(word => word.substring(0, 2).toUpperCase())
        .join('');
        
        const sizeCode = size.toUpperCase();
        const colorCode = this.getColorCode(color);
        
        return `${productCode}-${sizeCode}-${colorCode}`;
    }
    
    private static getColorCode(color: ProductColor): string {
        const colorMap = {
        [ProductColor.BLACK]: 'BLK',
        [ProductColor.WHITE]: 'WHT', 
        [ProductColor.GRAY]: 'GRY',
        [ProductColor.NAVY]: 'NVY',
        [ProductColor.RED]: 'RED',
        [ProductColor.BLUE]: 'BLU',
        };
        return colorMap[color];
    }

}