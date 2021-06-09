function doPost(e) {
    // herokuのアプリからの入力を受け取る
    const data = JSON.parse(e.postData.contents);
    let info = [data.incharge, data.date, parseInt(data.startTime)];
    let inchargeList = getInchargeList();
    for(i = 0; i < inchargeList.length; i++){
        if(info[0] == inchargeList[i][0]){
            var folderId = inchargeList[i][1];
            break;
        }
    };

    // 日付と日時のセット
    let startDate = new Date(info[1]);
    try{
        if(String(info[2]).length == 4){
            let hour = Math.floor(info[2] / 100);
            let min = info[2] - hour * 100;
            startDate.setHours(hour);
            startDate.setMinutes(min);
        }
    }catch(e){
        Logger.log(e);
    }
    Logger.log(startDate);
    let ary = [info[0], folderId, startDate];
    let newData = createMtgRec(ary);

    // 整形してSlackに投稿する
    let postData = {
        "text": "お疲れ様です。次回のmtgの議事録です！\n",
        "attachments": [{
          "color": "#09b2aa",
          "fields": [
            {
              "title": "担当名",
              "value": newData[1],
              "short": false
            },
            {
              "title": "開始時刻",
              "value": newData[0],
              "short": false
            },
            {
                "title": "議事録URL",
                "value": newData[2],
                "short": false
            }
          ]
        }
      ]
    };
    let payload = JSON.stringify(postData);
    let options = {
      'method':'post',
      'contentType':'application/json',
      'payload':payload
    };
    // Slackに投稿
    UrlFetchApp.fetch(POSTURL, options);
};

//スプシの取得
function getInchargeList() {
    const ss = SpreadsheetApp.openById(IDofINCHARGE);
    let sheet = ss.getSheets()[0];
    let range = sheet.getRange(2, 1, ss.getLastRow() - 1, 2);
    let value = range.getValues();
    let ary = [];
    for (i = 0; i < value.length; i++) {
        var folder = DriveApp.getFolderById(value[i][1])
        var url = folder.getUrl();
        var incharge = [value[i][0], value[i][1], url]
        ary.push(incharge)
    };

    Logger.log(ary);
    return ary;
}

function createMtgRec(ary) {
    // ary = [incharge, folderId, date]
    const formatFilePath = DriveApp.getFileById(IDofTEMP);
    let folderPath = DriveApp.getFolderById(ary[1]);

    let newDate = new Date(ary[2]);
    let MMdd = Utilities.formatDate(newDate, "JST", "MM/dd");
    let time = Utilities.formatDate(newDate, "JST", "MM/dd HH:mm")
    if (ary[0] == "その他") {
        ary[0] = "○○";
    }

    let fileName = MMdd + "_" + ary[0] + "_mtgレジュメ/議事録";
    let newFile = formatFilePath.makeCopy(fileName, folderPath);
    let doc = DocumentApp.openById(newFile.getId());
    let body = doc.getBody();
    body.replaceText('タイトル', fileName);
    body.replaceText("開始時刻", time);
    doc.saveAndClose();
    let fileUrl = newFile.getUrl();
    let info = [time, ary[0], fileUrl];
    Logger.log(info);
    return info;
}