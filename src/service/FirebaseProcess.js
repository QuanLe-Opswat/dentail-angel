import readXlsxFile from 'read-excel-file'; // https://www.npmjs.com/package/read-excel-file
import firebase from 'firebase';

const FILE_LENGTH = 5;

const FirebaseProcess = {
    analyze: async (files, callback) => {

        if (files.length !== FILE_LENGTH) {
            callback({
                done: true,
                success: false,
                type: 'error',
                text: `File length (${files.length}) not match. Should ${FILE_LENGTH}.`,
            });
            return;
        }

        files.sort((f1, f2) => f1.name.localeCompare(f2.name));
        // const names = ['ServiceType', 'Doctor', 'Client', 'Service', 'Paid'];
        const names = [];
        for (let key in schema) {
            if (schema.hasOwnProperty(key))
                names.push(key);
        }

        let data = {};
        let isError = false;
        for (let i = 0; i < names.length; i++) {
            callback({
                done: false,
                type: 'normal',
                text: `Getting '${names[i]}'...`,
            });
            data[names[i]] = await getData(files[i], schema[names[i]], data);
            if (data[names[i]].errors && data[names[i]].errors.length > 0) {
                isError = true;
                console.log(data[names[i]].errors);
                data[names[i]].errors.forEach(({ row, column, error }) => {
                    callback({
                        done: false,
                        success: false,
                        type: 'error',
                        text: `Error: file '${names[i]}': row '${row}': column '${column}': ${error}`,
                    });
                });
            }
        }

        if (isError) {
            callback({
                done: true,
                success: false,
                type: 'warning',
                text: `Fix all above error before continue.`,
            });
            return;
        }

        // console.log(data);

        callback({
            done: true,
            success: true,
            type: 'success',
            text: `Done Analyzing.`,
            data,
        });
    },

    upload: async (data, db, callback) => {
        callback({
            done: false,
            type: 'normal',
            text: `Start uploading...`,
        });

        for (let key in data) {
            if (data.hasOwnProperty(key)) {
                callback({
                    type: 'normal',
                    text: `Uploading '${key}'`,
                });

                let rows = data[key].rows;

                for (let i = 0; i < rows.length; i++) {
                    let docData = { ...rows[i] };
                    const defaultList = schema[key].defaultData;
                    for (let k in defaultList) {
                        if (!defaultList.hasOwnProperty(k))
                            continue;

                        const def = defaultList[k];
                        if (def.on) {
                            docData[k] = rows[i][def.on];
                        } else {
                            docData[k] = def.default;
                        }
                    }

                    // Push to database
                    try {
                        await db.collection('system').doc('data').collection(schema[key].model).doc('' + docData.ID).set(docData);
                    } catch (e) {
                        callback({
                            type: 'error',
                            text: `Add '${key}' at ID (${docData.ID}) fail: ${e.message}`,
                        });
                    }
                }
            }
        }

        callback({
            done: true,
            type: 'success',
            text: `Done Uploading.`,
        });
    },

    clear: async (db, callback) => {
        for (let key in schema) {
            callback({
                type: 'normal',
                text: `Deleting '${key}'`,
            });

            const snap = await db.collection('system').doc('data').collection(schema[key].model).get();
            let ids = [];
            snap.forEach(doc => {
                ids.push(doc.id);
            });

            await Promise.all(ids.map(id => db.collection('system').doc('data').collection(schema[key].model).doc(id).delete()));
        }

        callback({
            done: true,
            type: 'success',
            text: `Done deleting.`,
        });
    },
};

export default FirebaseProcess;

const getData = async (file, schema, rootData) => {
    const rows = await readXlsxFile(file);
    let data = [];
    let errors = [];
    let columnCount = schema.column.length;
    for (let i = schema.row; i < rows.length; i++) {
        let row = rows[i];
        if (columnCount !== row.length) {
            errors.push({ row: i + 1, column: 0, error: `Column count not match. ${row.length} vs ${columnCount}` });
        } else {
            let r = {};
            for (let j = 0; j < columnCount; j++) {
                let column = schema.column[j];
                let isError = false;

                if (column.required && row[j] === null) {
                    if (column.default) {
                        r[column.prop] = column.default;
                    } else {
                        errors.push({ row: i + 1, column: j + 1, error: 'Column is required.' });
                        isError = true;
                    }
                } else {
                    if (column.type === 'Number') {
                        if (isNaN(row[j])) {
                            errors.push({
                                row: i + 1,
                                column: j + 1,
                                error: `Value should be ${column.type === 'Number' ? 'Number' : 'Date'}.`,
                            });
                            isError = true;
                        } else {
                            r[column.prop] = parseInt(row[j]);
                        }
                    } else if (column.type === 'Date') {
                        r[column.prop] = firebase.firestore.Timestamp.fromDate(!row[j] || isNaN(row[j]) ? new Date() : row[j]);
                    } else {
                        r[column.prop] = row[j] ? '' + row[j] : '';

                        // If there is parse request
                        if (column.parse) {
                            if (column.parse.from.includes(r[column.prop])) {
                                r[column.prop] = column.parse.to[column.parse.from.findIndex(v => v === r[column.prop])];
                            } else {
                                errors.push({
                                    row: i + 1,
                                    column: j + 1,
                                    error: `Value should be one of [${column.parse.from.join(', ')}].`,
                                });
                            }
                        }
                    }
                }

                // Check id unify
                if (data.some(d => d.ID === r.ID)) {
                    errors.push({
                        row: i + 1,
                        column: j + 1,
                        error: `Id (${r.ID}) is duplicated.`,
                    });
                }

                // Check id link
                if (!isError && column.related) {
                    if (rootData[column.related].rows.every(row => row.ID !== r[column.prop])) {
                        errors.push({
                            row: i + 1,
                            column: j + 1,
                            error: `Id (${r[column.prop]}) not exist in ${column.related}.`,
                        });
                    }
                }

                // Generate Avatar if client
                if (column.prop === 'ClientGenderCode' && (r['ClientGenderCode'] === 1 || r['ClientGenderCode'] === 2)) {
                    let ran = Math.floor(Math.random() * Math.floor(r['ClientGenderCode'] === 1 ? 23 : 25));
                    r.SimulateAvatar = (r['ClientGenderCode'] === 1 ? 'boy_' : 'girl_') + ran;
                }
            }
            data.push(r);
        }
    }

    return { rows: data, errors };
};

const Default_Push = {
    CreateByID: { default: 0 },
    CreatedDateTime: { default: firebase.firestore.Timestamp.fromDate(new Date()) },
    LastModifyByID: { default: 0 },
    LastModifyDateTime: { default: firebase.firestore.Timestamp.fromDate(new Date()) },
    IsDeleted: { default: false },
    DeletedByID: { default: 0 },
    DeletedDateTime: { default: firebase.firestore.Timestamp.fromDate(new Date(0)) },
};

const schema = {
    // File 1: Services
    ServiceType: {
        row: 1,
        model: 'ServiceTypeModel',
        column: [{ prop: 'ID', type: 'Number', required: true },
            { prop: 'ServiceName', type: 'String', required: true },
            { prop: 'PriceFrom', type: 'Number', required: true },
            { prop: 'PriceTo', type: 'Number', required: true },
            { prop: 'Comment', type: 'String' }],
        defaultData: {
            ...Default_Push,
        },
    },

    // File 2: Doctors
    Doctor: {
        row: 1,
        model: 'DoctorModel',
        column: [{ prop: 'ID', type: 'Number', required: true },
            { prop: 'DoctorName', type: 'String', required: true },
            { prop: 'Comment', type: 'String' }],
        defaultData: {
            ...Default_Push,
        },
    },

    // File 3: Client
    Client: {
        row: 1,
        model: 'ClientModel',
        column: [{ prop: 'ID', type: 'Number', required: true },
            { prop: 'ClientFullName', type: 'String', required: true },
            { prop: 'PhoneNumber', type: 'String', required: true, default: '0000000000' },
            { prop: 'ClientGenderCode', type: 'String', required: true, parse: { from: ['Nam', 'Nữ'], to: [1, 2] } },
            { prop: 'Address', type: 'String', required: true },
            { prop: 'BirthDateTime', type: 'Date' },
            { prop: 'Comment', type: 'String' }],
        defaultData: {
            ...Default_Push,
            ClientIdentifier: { on: 'ID' },
        },
    },

    // File 4: Client Service
    Service: {
        row: 1,
        model: 'ServiceModel',
        column: [{ prop: 'ID', type: 'Number', required: true },
            { prop: 'ClientID', type: 'Number', required: true, related: 'Client' },
            { prop: 'DoctorId', type: 'Number', required: true, related: 'Doctor' },
            { prop: 'ServiceTypeId', type: 'Number', required: true, related: 'ServiceType', default: 1 },
            { prop: 'ServiceDateTime', type: 'Date' },
            { prop: 'TotalFee', type: 'Number', required: true, default: 1 },
            {
                prop: 'PaymentTypeCode',
                type: 'String',
                parse: {
                    from: ['Tiền mặt (đã hoàn thành thanh toán)', 'Trả góp dài hạn', 'Trả góp ngắn hạn'],
                    to: [1, 2, 3],
                },
                required: true,
                default: 1,
            },
            { prop: 'Comment', type: 'String' }],
        defaultData: {
            ...Default_Push,
            PaidFee: { default: 0 },
        },
    },

    // File 5: History Pay
    Paid: {
        row: 3,
        model: 'PaidModel',
        column: [{ prop: 'ID', type: 'Number', required: true },
            { prop: 'ServiceID', type: 'Number', required: true, related: 'Service' },
            { prop: 'CashPaied', type: 'Number', required: true },
            { prop: 'PaiedDate', type: 'Date', required: true },
            { prop: 'Comment', type: 'String' }],
    },
};
