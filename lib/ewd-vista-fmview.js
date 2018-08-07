/* Load infrastructure */
let vista = require('ewd-vista');

/* Set-up module.export.handlers structure */
module.exports          = {};
module.exports.handlers = {};

/* Sets up Symbol Table management
 * Called when module is loaded by QEWD */
module.exports.init = function() {
  vista.init.call(this);
};

// Pre handler security checks - security keys mainly
module.exports.beforeHandler = vista.beforeHandler;

module.exports.handlers.fileQuery = function(messageObj, session, send, finished) {
  var prefix = messageObj.params.prefix.toUpperCase();
  var results     = [];
  var namesById = {};
  var files = {};
  var floatPrefix = parseFloat(prefix);
  if(floatPrefix > 0){
    let dicIndex = new this.documentStore.DocumentNode('DIC', [floatPrefix, '0']);
    if(dicIndex.exists){
      results.push({
        id: floatPrefix,
        text: dicIndex.value.split('^')[0]
      });
      namesById[floatPrefix] = dicIndex.value.split('^')[0];
    }
    files = {
      results: results,
      namesById: namesById
    };
  }else{
    var max = 40;
    let dicIndex = new this.documentStore.DocumentNode('DIC', ['B']);
    var i = 0;
    dicIndex.forEachChild({
      prefix: prefix
    }, function (name,node) {
      node.forEachChild( (id) => {
        i++;
        if (i > max) return true;
        results.push({
          id: id,
          text: name
        });
        namesById[id] = name;
      });
      if (i > max) return true;
    });
    files = {
      results: results,
      namesById: namesById
    };
  }
  finished({files: files});
};

module.exports.handlers.generateMap = function(messageObj, session, send, finished) {
  var tempNode = new this.documentStore.DocumentNode('TMP', ['ewd',process.pid,'concept']);
  tempNode.delete();
  var result = this.db.function({function: 'PKGFILES^ewdVistAFmView', arguments: [process.pid]});
  var output = tempNode.getDocument();
  tempNode.delete();
  finished({output: output});
  /*var fs = require('fs');
  var str = JSON.stringify(output);
  fs.writeFileSync('/home/osehra/qewd/www/ewd-vista/assets/javascripts/CMAP.json', str);
  */
};

module.exports.handlers.getFile = function(messageObj, session, send, finished) {
  var fileNode = new this.documentStore.DocumentNode('DIC', [messageObj.params.fileId]);
  if(!fileNode.exists){
    return{
      error: messageObj.params.fileId + ' file not exists.'
    }
  }
  //documentStore.session.$('fileIdSelected').value = params.fileId;
  var results = prepareTreeData(messageObj.params.fileId, this.documentStore);
  var output = {
    results: results,
    error: ''
  };
  finished({output: output});
};

var prepareTreeData = function(fileNumber, documentStore) {
    var file = new documentStore.DocumentNode("DIC", [fileNumber, '0']);
    var fileName = '';
    fileName = file.value.split('^')[0] + ' [' + fileNumber + ']';
    var downward = {
        "direction":"downward",
        "name":"origin",
        "children": []
    };
    var upward = {
        "direction":"upward",
        "name":"origin",
        "children": []
    };
    // The "PT" node of file zero node contains all the files in which that file is used as a pointed file.
    var filePT = new documentStore.DocumentNode("DD", [fileNumber, '0', 'PT']);
    filePT.forEachChild( (name, node) => {
      var result = getChildNode(name,documentStore);
      if(result !== null){
          downward.children.push(result);
      }
    });
    var files = getFilePointers(fileNumber, documentStore);
    upward.children = files;
    return {
        "name": fileName,
        "fileDD" : {
            "upward": upward,
            "downward": downward
        }
  };
};
var getChildNode = function(fileNumber,documentStore){
    var result = {};
    var file = new documentStore.DocumentNode("DIC", [fileNumber, '0']);
    if(file.exists){
        var fileName = '';
        var fileName = file.value.split('^')[0] + ' [' + fileNumber + ']';
        result.name = fileName;
        result.children = [];
    }else{
        var file = new documentStore.DocumentNode("DD", [fileNumber, '0', 'UP']);
        if(file.exists){
            result = getChildNode(file.value,documentStore);
        }
        else{
            result = null;
        }
    }
    return result;
};
var getFilePointers = function(fileNumber, documentStore){
    var results = [];
    var file = new documentStore.DocumentNode("DD", [fileNumber]);
    //Traverse all fields of fileman file through DD Global
    file.forEachChild({
      range: {
        from: '0',
        to: 'A'
      }
    }, function(fieldNumber, node) {
        if(fieldNumber == '0') return;
        if(isNaN(fieldNumber)) return;
        console.log('Looking in DD for field#' + fieldNumber + ' in file#' + fileNumber);
        var field = new documentStore.DocumentNode("DD", [fileNumber, fieldNumber, '0']);
        var field0Node = field.value.split('^');
        var multipleFileNumber = 0;
        //Look for the second piece of the ^DD(fileNumber, fieldNumber, 0) node for the pointer or Variable Pointer field
        //if second piece contains V means it is a Variable Pointer type field
        if(field0Node[1].indexOf("V") > -1){
            //Get all the files from the B index of the variable pointer field node
            var vpointerfiles = new documentStore.DocumentNode("DD", [fileNumber, fieldNumber, "V", "B"]);
            vpointerfiles.forEachChild(function(vfile, vfnode) {
                var file = new documentStore.DocumentNode("DIC", [vfile, '0']);
                var fileName = '';
                var fileName = file.value.split('^')[0] + ' [' + vfile + ']';
                results.push({
                    "name": fileName,
                    "children": []
                });
            });
        }
        //if second piece contains P means it is a pointer type field
        if(field0Node[1].indexOf("P") > -1){
          var pattern = new RegExp(fileNumber + '.*P','g');
          if(pattern.test(field0Node[1])) {
            //It means it is multiple File
            multipleFileNumber = field0Node[1].split('P')[0];
          }else{
            //If Second Piece contains , means there is global with file number like TIU(8925,
            if(field0Node[2].indexOf(",") > -1){
                var pointedFile0 = new documentStore.DocumentNode(field0Node[2].split('(')[0], [field0Node[2].split('(')[1].split(',')[0], '0']);
                if(pointedFile0.exists){
                    var fileName = '';
                    fileName = pointedFile0.value.split('^')[0] + ' [' + pointedFile0.value.split('^')[1] + ']';
                    results.push({
                        "name": fileName,
                        "children": []
                    });
                }
            }
            //else we assume that Socond piece would be containg the global reference without file number within node like ^DPT(
            else {
                var pointedFile0 = new documentStore.DocumentNode(field0Node[2].split('(')[0], ['0']);
                if(pointedFile0.exists){
                    var fileName = '';
                    fileName = pointedFile0.value.split('^')[0] + ' [' + pointedFile0.value.split('^')[1] + ']';
                    results.push({
                        "name": fileName,
                        "children": []
                    });
                }
            }
          }
        }else{
            multipleFileNumber = parseFloat(field0Node[1]);
        }
        if(multipleFileNumber>0){
            var multipleFile = new documentStore.DocumentNode("DD", [multipleFileNumber, '0']);
            if(multipleFile.exists){
                var fileName = multipleFile.value.split('^')[0] + ' [' + multipleFileNumber + ']';
                //If multiple file exists then do recursive call to get all pointers of that multiple file
                var multipleResults = getFilePointers(multipleFileNumber, documentStore);
                if(multipleResults.length > 0){
                    results.push({
                        "name" : fileName,
                        "children": multipleResults
                    });
                }
            }
        }
    });
    return results;
};
