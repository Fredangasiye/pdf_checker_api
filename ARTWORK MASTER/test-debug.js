const { PDFDocument, PDFName } = require('pdf-lib');
const fs = require('fs');

async function testColorDetection() {
  console.log('🔍 Starting color detection test...');
  
  try {
    // Load a test PDF
    const pdfPath = './uploads/file-1754635852587-6ydaspcih.pdf';
    const pdfBytes = fs.readFileSync(pdfPath);
    console.log('🔍 PDF loaded, size:', pdfBytes.length);
    
    const pdfDoc = await PDFDocument.load(pdfBytes);
    console.log('🔍 PDF document loaded');
    
    const pageCount = pdfDoc.getPageCount();
    console.log('🔍 Page count:', pageCount);
    
    if (pageCount > 0) {
      const firstPage = pdfDoc.getPage(0);
      const resources = firstPage.node.Resources();
      console.log('🔍 Resources found:', !!resources);
      
      if (resources) {
        // Look for ColorSpace specifically
        const colorSpace = resources.lookup(PDFName.of('ColorSpace'));
        console.log('🔍 ColorSpace found:', !!colorSpace);
        
        if (colorSpace) {
          console.log('🔍 ColorSpace dict entries:');
          const entries = colorSpace.entries();
          console.log('🔍 ColorSpace entries count:', entries.length);
          
          entries.forEach(([key, value], index) => {
            console.log(`🔍 ColorSpace entry ${index}:`, key.toString(), '=>', value);
            
            // If it's a PDFRef, try to resolve it
            if (value.constructor?.name === 'PDFRef') {
              console.log(`🔍 Following reference ${index}:`, value.objectNumber);
              
              try {
                // Try to get the referenced object from the context
                const context = firstPage.node.context;
                const referencedObject = context.indirectObjects.get(value);
                console.log(`🔍 Referenced object ${index}:`, referencedObject);
                console.log(`🔍 Referenced object ${index} type:`, referencedObject?.constructor?.name);
                
                if (referencedObject) {
                  // Try to get string representation
                  try {
                    const str = referencedObject.toString();
                    console.log(`🔍 Referenced object ${index} string:`, str.substring(0, 500));
                  } catch (e) {
                    console.log(`🔍 Referenced object ${index} string error:`, e.message);
                  }
                  
                  // If it's a PDFDict, examine its entries
                  if (referencedObject.constructor?.name === 'PDFDict') {
                    const refEntries = referencedObject.entries();
                    console.log(`🔍 Referenced object ${index} entries count:`, refEntries.length);
                    refEntries.forEach(([refKey, refValue], refIndex) => {
                      console.log(`🔍 Referenced object ${index} entry ${refIndex}:`, refKey.toString(), '=>', refValue);
                      try {
                        const refStr = refValue.toString();
                        console.log(`🔍 Referenced object ${index} entry ${refIndex} string:`, refStr.substring(0, 200));
                      } catch (e) {
                        console.log(`🔍 Referenced object ${index} entry ${refIndex} string error:`, e.message);
                      }
                    });
                  }
                }
              } catch (e) {
                console.log(`🔍 Error resolving reference ${index}:`, e.message);
              }
            }
          });
        }
      }
    }
    
  } catch (error) {
    console.error('🔍 Error during test:', error);
  }
}

testColorDetection(); 