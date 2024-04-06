export class Utils {
    public static levelFormula(score: number) {
        return Math.floor(Math.sqrt(score / 20000)) + 1;
    }
}