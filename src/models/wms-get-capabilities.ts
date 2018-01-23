import { IWmsDescription } from '../models/config';
import { IpAddress } from '../utils/utils';
import { IDatasource, IDatasourceService } from '../models/datasource';

/**
 * A simple class which, based on a template, creates an XML Get Capabilities v1.1.1 response.
 * 
 * Reference: http://schemas.opengis.net/wms/1.1.1/capabilities_1_1_1.xml
 * 
 * @export
 * @class WmsGetCapbilities
 */
export class WmsGetCapbilities {
  static create(d: IWmsDescription, port: number, datasources: IDatasource[], externalHostname?: string) {
    let keywords = d.keywords.reduce((a, b) => { return `${a}<Keyword>${b}</Keyword>`; }, '');
    let hostname = externalHostname || IpAddress.get();
    let layers = '';
    datasources.forEach(ds => {
      layers += WmsGetCapbilities.createLayer(ds.title, ds.layerID, d.boundaryBox);
    });

    let xml = `<?xml version="1.0" encoding="utf-8"?>
<WMT_MS_Capabilities updateSequence="0" version="1.1.1">
  <Service>
    <Name>OGC:WMS</Name>
    <Title>${d.title}</Title>
    <Abstract>${d.abstract}</Abstract>
    <KeywordList>
      ${keywords}
    </KeywordList>
    <OnlineResource xlink:href="${hostname}:${port}/" xlink:type="simple" xmlns:xlink="http://www.w3.org/1999/xlink"/>
    <ContactInformation>
      <ContactPersonPrimary>
        <ContactPerson>${d.contact.person}</ContactPerson>
        <ContactOrganization>${d.contact.organization}</ContactOrganization>
      </ContactPersonPrimary>
      <ContactPosition>${d.contact.position}</ContactPosition>
      <ContactAddress>
        <AddressType>postal</AddressType>
        <Address>${d.contact.address}</Address>
        <City>${d.contact.city}</City>
        <StateOrProvince>${d.contact.state}</StateOrProvince>
        <PostCode>${d.contact.postcode}</PostCode>
        <Country>${d.contact.country}</Country>
      </ContactAddress>
      <ContactVoiceTelephone>${d.contact.telephone}</ContactVoiceTelephone>
      <ContactElectronicMailAddress>${d.contact.email}</ContactElectronicMailAddress>
    </ContactInformation>
    <Fees>NONE</Fees>
    <AccessConstraints>Geen Beperkingen</AccessConstraints>
  </Service>
  <Capability>
    <Request>
      <GetCapabilities>
        <Format>application/vnd.ogc.wms_xml</Format>
        <DCPType>
          <HTTP>
            <Get>
              <OnlineResource xlink:href="${hostname}:${port}/${d.path ? d.path + '/' : ''}" xlink:type="simple" xmlns:xlink="http://www.w3.org/1999/xlink"/>
            </Get>
          </HTTP>
        </DCPType>
      </GetCapabilities>
      <GetMap>
        <Format>image/png</Format>
        <DCPType>
          <HTTP>
            <Get>
              <OnlineResource xlink:href="${hostname}:${port}/${d.path ? d.path + '/' : ''}" xlink:type="simple" xmlns:xlink="http://www.w3.org/1999/xlink"/>
            </Get>
          </HTTP>
        </DCPType>
      </GetMap>
    </Request>
    <Exception>
      <Format>application/vnd.ogc.se_xml</Format>
      <Format>application/vnd.ogc.se_inimage</Format>
      <Format>application/vnd.ogc.se_blank</Format>
    </Exception>
    <Layer>
      <Title>${d.title}</Title>
      <Abstract>${d.abstract}</Abstract>
      <!--Limited list of EPSG projections:-->
      <SRS>EPSG:4326</SRS>
      <SRS>EPSG:28992</SRS>
      <SRS>EPSG:3857</SRS>
      ${d.boundaryBox}
      <AuthorityURL name="TNO">
        <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="${d.authority.url}"/>
      </AuthorityURL>
${layers}    </Layer>
  </Capability>
</WMT_MS_Capabilities>
`;
    console.log(xml);
    return xml;
  }

  static createLayer(title: string, layerID: number, boundaryBox: string) {
    return `      <Layer queryable="0" opaque="0">
        <Name>${layerID}</Name>
        <Title>${title}</Title>
        <Abstract/>
        <KeywordList/>
        <SRS>EPSG:4326</SRS>
        ${boundaryBox}
      </Layer>
`;
  }

  static create_v130(d: IWmsDescription, port: number) {
    let keywords = d.keywords.reduce((a, b) => { return `${a}<Keyword>${b}</Keyword>\r`; }, '');
    let hostname = IpAddress.get();
    let xml = `<?xml version="1.0" encoding="utf-8"?>
<WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.opengis.net/wms http://schemas.opengis.net/wms/1.3.0/capabilities_1_3_0.xsd">
  <Service>
    <Name>WMS</Name>
    <Title>${d.title}</Title>
    <Abstract>${d.abstract}</Abstract>
    <KeywordList>
      ${keywords}
    </KeywordList>
    <OnlineResource xlink:href="${hostname}" xlink:type="simple" xmlns:xlink="http://www.w3.org/1999/xlink"/>
    <ContactInformation>
      <ContactPersonPrimary>
        <ContactPerson>${d.contact.person}</ContactPerson>
        <ContactOrganization>${d.contact.organization}</ContactOrganization>
      </ContactPersonPrimary>
      <ContactPosition>${d.contact.position}</ContactPosition>
      <ContactAddress>
        <AddressType>postal</AddressType>
        <Address>${d.contact.address}</Address>
        <City>${d.contact.city}</City>
        <StateOrProvince>${d.contact.state}</StateOrProvince>
        <PostCode>${d.contact.postcode}</PostCode>
        <Country>${d.contact.country}</Country>
      </ContactAddress>
      <ContactVoiceTelephone>${d.contact.telephone}</ContactVoiceTelephone>
      <ContactElectronicMailAddress>${d.contact.email}</ContactElectronicMailAddress>
    </ContactInformation>
    <Fees>NONE</Fees>
    <AccessConstraints>Geen Beperkingen</AccessConstraints>
  </Service>
  <Capability>
    <Request>
      <GetCapabilities>
        <Format>application/vnd.ogc.wms_xml</Format>
        <DCPType>
          <HTTP>
            <Get>
              <OnlineResource xlink:href="${hostname}:${port}/${d.path ? d.path + '/' : ''}" xlink:type="simple" xmlns:xlink="http://www.w3.org/1999/xlink"/>
            </Get>
          </HTTP>
        </DCPType>
      </GetCapabilities>
      <GetMap>
        <Format>image/png</Format>
        <DCPType>
          <HTTP>
            <Get>
              <OnlineResource xlink:href="${hostname}:${port}/${d.path ? d.path + '/' : ''}" xlink:type="simple" xmlns:xlink="http://www.w3.org/1999/xlink"/>
            </Get>
          </HTTP>
        </DCPType>
      </GetMap>
    </Request>
    <Exception>
      <Format>application/vnd.ogc.se_xml</Format>
      <Format>application/vnd.ogc.se_inimage</Format>
      <Format>application/vnd.ogc.se_blank</Format>
    </Exception>
    <Layer>
      <Title>${d.title}</Title>
      <Abstract>${d.abstract}</Abstract>
      <!--Limited list of EPSG projections:-->
      <SRS>EPSG:4326</SRS>
      <SRS>EPSG:28992</SRS>
      <SRS>EPSG:25831</SRS>
      <SRS>EPSG:25832</SRS>
      <SRS>EPSG:3034</SRS>
      <SRS>EPSG:3035</SRS>
      <SRS>EPSG:3857</SRS>
      <SRS>EPSG:4258</SRS>
      <BoundingBox SRS="EPSG:4326" minx="3.1983876629326096" miny="50.67199330930464" maxx="7.276276007218319" maxy="53.611058210234226"/>
      <BoundingBox SRS="EPSG:28992" minx="198.35995763429673" miny="297982.12118999794" maxx="288467.017801902" maxy="627198.177920129"/>
      <BoundingBox SRS="EPSG:4258" minx="3.1983876629326096" miny="50.671993310229134" maxx="7.276276007218319" maxy="53.61105821113472"/>
      <BoundingBox SRS="EPSG:3035" minx="3840960.9640937895" miny="3065835.1632006546" maxx="4140754.795657711" maxy="3410383.5662371013"/>
      <BoundingBox SRS="EPSG:3034" minx="3536366.7418895573" miny="2660749.851870641" maxx="3825758.1170010827" maxy="2993244.120133618"/>
      <BoundingBox SRS="EPSG:3857" minx="356042.88599714637" miny="6563476.950523433" maxx="809991.339994857" maxy="7096836.805565288"/>
      <BoundingBox SRS="EPSG:25831" minx="513125.1294499418" miny="5613369.109225448" maxx="802120.1394259091" maxy="5948752.645041717"/>
      <BoundingBox SRS="EPSG:25832" minx="90177.80192610662" miny="5614767.760183974" maxx="385965.1579375231" maxy="5955907.673148672"/>
      <AuthorityURL name="TNO">
        <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://www.tno.nl"/>
      </AuthorityURL>
      <Layer queryable="0" opaque="0">
        <Name>0</Name>
        <Title>Mijn test</Title>
        <Abstract/>
        <KeywordList/>
        <SRS>EPSG:4326</SRS>
        <EX_GeographicBoundingBox>
            <westBoundLongitude>3.200822914225144</westBoundLongitude>
            <eastBoundLongitude>7.274175583156302</eastBoundLongitude>
            <southBoundLatitude>50.67199330930464</southBoundLatitude>
            <northBoundLatitude>53.56344128335662</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <BoundingBox SRS="EPSG:4326" minx="3.199769363476108" miny="50.671799068129744" maxx="7.273103484702655" maxy="53.56324764934842"/>
        <BoundingBox SRS="EPSG:28992" minx="10000.0" miny="300000.0" maxx="280000.0" maxy="619700.0"/>
        <BoundingBox SRS="EPSG:4258" minx="3.199769363476108" miny="50.67179906905423" maxx="7.273103484702655" maxy="53.56324765024937"/>
        <BoundingBox SRS="EPSG:3035" minx="3850641.263992549" miny="3066657.944473882" maxx="4140280.3444416802" maxy="3402887.6793912034"/>
        <BoundingBox SRS="EPSG:3034" minx="3545720.716732052" miny="2661541.4624270657" maxx="3825307.332249613" maxy="2985999.851007993"/>
        <BoundingBox SRS="EPSG:3857" minx="356196.69619807746" miny="6563442.832219786" maxx="809638.1764038831" maxy="7087870.744478874"/>
        <BoundingBox SRS="EPSG:25831" minx="513237.6218041236" miny="5613382.593724653" maxx="793568.9736972002" maxy="5941797.583686596"/>
        <BoundingBox SRS="EPSG:25832" minx="99891.85544568882" miny="5615471.767175654" maxx="385586.75121962104" maxy="5948397.778853643"/>
      </Layer>
    </Layer>
  </Capability>
</WMS_Capabilities>
`;
    console.log(xml);
    return xml;
  }
}
