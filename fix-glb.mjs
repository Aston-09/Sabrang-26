import { NodeIO } from '@gltf-transform/core';
import { KHRMaterialsTransmission, KHRMaterialsIOR, KHRMaterialsClearcoat } from '@gltf-transform/extensions';

async function run() {
  const io = new NodeIO().registerExtensions([
    KHRMaterialsTransmission,
    KHRMaterialsIOR,
    KHRMaterialsClearcoat
  ]);

  console.log('Loading GLB...');
  const doc = await io.read('./public/models/SABRANG_TRANSPARENT_STRIP_PRISM.glb');
  
  const transmissionExt = doc.createExtension(KHRMaterialsTransmission);
  const iorExt = doc.createExtension(KHRMaterialsIOR);
  const clearcoatExt = doc.createExtension(KHRMaterialsClearcoat);

  const materials = doc.getRoot().listMaterials();
  for (const mat of materials) {
    console.log(`Modifying material: ${mat.getName()}`);
    
    // Set base color to white
    mat.setBaseColorFactor([1, 1, 1, 1]);
    
    // Set properties for clear glass
    mat.setMetallicFactor(0.0);
    mat.setRoughnessFactor(0.01);
    
    // Add transmission
    const transmission = transmissionExt.createTransmission().setTransmissionFactor(1.0);
    mat.setExtension('KHR_materials_transmission', transmission);
    
    // Add IOR
    const ior = iorExt.createIOR().setIOR(1.46);
    mat.setExtension('KHR_materials_ior', ior);
    
    // Add Clearcoat
    const clearcoat = clearcoatExt.createClearcoat().setClearcoatFactor(0.15).setClearcoatRoughnessFactor(0.0);
    mat.setExtension('KHR_materials_clearcoat', clearcoat);
  }

  const outPath = './public/models/SABRANG_CLEAR_ALCHE_PRISM.glb';
  console.log(`Saving to ${outPath}...`);
  await io.write(outPath, doc);
  console.log('Done!');
}

run().catch(console.error);
