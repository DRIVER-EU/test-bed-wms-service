import * as fs from 'fs';
import * as path from 'path';
import { StringUtils } from '../utils/utils';
import { IMapnikStyle, MapnikStyleType } from '../models/mapnik-style';
import { IDatasource } from '../models/datasource';

export class StyleGenerator {
  private styleDictionary: { [key: string]: string } = {};
  private generatedStyleFolder: string;

  constructor(private styleFolder: string) {
    styleFolder = path.resolve(styleFolder);
    if (!fs.existsSync(styleFolder)) throw new Error(`Style folder ${styleFolder} does not exist!`);
    this.generatedStyleFolder = path.join(styleFolder, 'generated');
    if (!fs.existsSync(this.generatedStyleFolder)) fs.mkdirSync(this.generatedStyleFolder);
    this.loadStyles(styleFolder);
  }

  /**
   * Load all existing styles
   * 
   * @private
   * @param {string} styleFolder
   * @returns
   * 
   * @memberOf StyleGenerator
   */
  private loadStyles(styleFolder: string) {
    fs.readdir(styleFolder, (err, files) => {
      if (err) {
        return console.error('StyleGenerator error: ' + err.message);
      }
      files.forEach(file => {
        if (path.extname(file) !== '.xml') return;
        fs.readFile(path.join(styleFolder, file), 'utf8', (err, data) => {
          let key = StringUtils.getFilenameWithoutExtension(file);
          this.styleDictionary[key] = data;
        });
      });
    });
  }

  public create(styleName: string, datasources: IDatasource[]) {
    let layers = '';

    datasources.forEach(ds => {
      let key = ds.title;
      if (this.styleDictionary.hasOwnProperty(key)) {
        let style = this.styleDictionary[key].replace(/{{FILENAME}}/g, ds.file);
        layers += style;
      }
    });

    layers = layers.replace(/{{STYLENAME}}/g, styleName);

    let timestamp = Date.now();
    let style = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE Map[]>
<Map srs="+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0.0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs +over" background-color="#00000000" font-directory="../fonts">

<Parameters>
  <Parameter name="bounds">-180,-85.05112877980659,180,85.05112877980659</Parameter>
  <Parameter name="center">0,0,2</Parameter>
  <Parameter name="format">png8</Parameter>
  <Parameter name="minzoom">0</Parameter>
  <Parameter name="maxzoom">22</Parameter>
  <Parameter name="scale">1</Parameter>
  <Parameter name="metatile">2</Parameter>
  <Parameter name="id"><![CDATA[${styleName}]]></Parameter>
  <Parameter name="_updated">${timestamp}</Parameter>
  <Parameter name="tilejson"><![CDATA[2.0.0]]></Parameter>
  <Parameter name="scheme"><![CDATA[xyz]]></Parameter>
</Parameters>

<FontSet name="fontset-0">
  <Font face-name="DejaVu Sans Book"/>
</FontSet>

${layers}

</Map>`;

    let stylesheet = path.join(this.generatedStyleFolder, styleName + '.xml');
    fs.writeFileSync(stylesheet, style, {encoding: 'utf8'});
    return stylesheet;
  }

  /**
   * Create a default style for GeoJSON point layers.
   * 
   * Expects the name property to be Name, and a state property with value 0 and 1.
   * @private
   * @static
   * @param {string} layer
   * @param {string} filename
   * 
   * @memberOf StyleGenerator
   */
  private static createGeoJsonPointStyle(layer: string, filename: string) {
    return `<Style name="${layer}-label" filter-mode="first">
  <Rule>
    <MaxScaleDenominator>12500</MaxScaleDenominator>
    <TextSymbolizer fontset-name="fontset-0" fill="#888888" halo-fill="rgba(255, 255, 255, 0.7)" halo-radius="2.5" size="12" dy="18" ><![CDATA[[Name]]]></TextSymbolizer>
  </Rule>
</Style>
<Style name="${layer}-icon" filter-mode="first">
  <Rule>
    <MaxScaleDenominator>100000</MaxScaleDenominator>
    <Filter>([state] = 2)</Filter>
    <MarkersSymbolizer width="24" fill="#ff0000" file="data/${layer}.svg" />
  </Rule>
  <Rule>
    <MaxScaleDenominator>750000</MaxScaleDenominator>
    <MinScaleDenominator>100000</MinScaleDenominator>
    <Filter>([state] = 2)</Filter>
    <MarkersSymbolizer width="18" fill="#ff0000" file="data/${layer}.svg" />
  </Rule>
  <Rule>
    <MinScaleDenominator>750000</MinScaleDenominator>
    <Filter>([state] = 2)</Filter>
    <MarkersSymbolizer fill="#ff0000" width="14" file="data/${layer}.svg" />
  </Rule>
  <Rule>
    <MaxScaleDenominator>100000</MaxScaleDenominator>
    <Filter>([state] = 1)</Filter>
    <MarkersSymbolizer width="24" fill="#ffc859" file="data/${layer}.svg" />
  </Rule>
  <Rule>
    <MaxScaleDenominator>750000</MaxScaleDenominator>
    <MinScaleDenominator>100000</MinScaleDenominator>
    <Filter>([state] = 1)</Filter>
    <MarkersSymbolizer width="18" fill="#ffc859" file="data/${layer}.svg" />
  </Rule>
  <Rule>
    <MinScaleDenominator>750000</MinScaleDenominator>
    <Filter>([state] = 1)</Filter>
    <MarkersSymbolizer fill="#ffc859" width="14" file="data/${layer}.svg" />
  </Rule>
  <Rule>
    <MaxScaleDenominator>100000</MaxScaleDenominator>
    <MarkersSymbolizer width="24" file="data/${layer}.svg" />
  </Rule>
  <Rule>
    <MaxScaleDenominator>750000</MaxScaleDenominator>
    <MinScaleDenominator>100000</MinScaleDenominator>
    <MarkersSymbolizer width="18" file="data/${layer}.svg" />
  </Rule>
  <Rule>
    <MinScaleDenominator>750000</MinScaleDenominator>
    <MarkersSymbolizer width="14" file="data/${layer}.svg" />
  </Rule>
</Style>
<Layer name="${layer}"
  srs="+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs">
    <StyleName>${layer}-icon</StyleName>
    <StyleName>${layer}-label</StyleName>
    <Datasource>
       <Parameter name="file"><![CDATA[${filename}]]></Parameter>
       <Parameter name="layer"><![CDATA[OGRGeoJSON]]></Parameter>
       <Parameter name="id"><![CDATA[${layer}]]></Parameter>
       <Parameter name="project"><![CDATA[{{STYLENAME}}]]></Parameter>
       <Parameter name="srs"><![CDATA[]]></Parameter>
       <Parameter name="type"><![CDATA[ogr]]></Parameter>
    </Datasource>
  </Layer>
`;
  }
}
