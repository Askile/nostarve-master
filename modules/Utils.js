export class Utils {
    static levelFormula(score) {
        return Math.floor(Math.sqrt(score / 20000)) + 1;
    }
}
