import { Schema } from './FirebaseImport';

// import dataJson from './TempData';

class FirebaseExport {
    async export(db) {
        const allData = [];
        const keys = Object.getOwnPropertyNames(Schema);
        for (let i = 0; i < keys.length; i++) {
            // for (let i = 0; i < 1; i++) {
            const key = keys[i];
            const schema = Schema[key];
            const model = {
                sheet: `${schema.fileNo}_${schema.fileName.replace(/\s/g, '_')}`,
                data: await this.getData(db, schema),
                column: schema.column,
            };
            allData.push(model);
        }

        // console.log(JSON.stringify(allData));

        return allData.map((d) => ({ ...d, data: d.data.sort((a, b) => a.ID > b.ID ? 1 : a.ID < b.ID ? -1 : 0) }));

        // return dataJson;
    }

    async getData(db, template) {
        const docRoot = db.collection('system').doc('data');
        const snap = await docRoot.collection(template.model).get();
        const data = [];
        snap.forEach(doc => {
            const docData = doc.data();
            if (!docData.IsDeleted) {
                let row = {};
                template.column.forEach(col => {
                    row[col.prop] = docData[col.prop];
                });
                data.push(row);
            }
        });

        return data;
    }
}

export default new FirebaseExport();
