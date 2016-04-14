/**月视图
 */
function makeMonthView(year, month){
    if(year <= 1900 || month < 1|| month > 12) {
        console.log("year/month is illegal, reset to 1992/03");
        year = 1992;
        month = 3;
    }

    //Make Calendar
    var tableObj = document.getElementById("calendar");
    var calendarObj = makeMonthCalendar(tableObj, year, month);
    //Make Title
    var headerObj = document.getElementById("month_title");
    makeMonthHeader(headerObj, year, month);
    //Make Event View
    
}

function makeMonthHeader(headerObj, year, month){
    //headObj为传入的div对象
    var titleText = year + "年"  + month + "月";
    headerObj.innerHTML = titleText;
}

function clearMonthCalendar(tableObj){
    var childNodes = tableObj.childNodes;
    for(var i=childNodes.length-1; i>1; i--){
        //the first line shows the week and should NOT be removed
        tableObj.removeChild(childNodes[i]);
    }
}

function makeMonthCalendar(tableObj, year, month){
    //月历部分, tableObj为传入的table对象
    var CLASS_NAME_TODAY = "today";
    var CLASS_NAME_TR = "item_tr";
    var CLASS_NAME_TD = "item_td";
    var CLASS_NAME_DIV_CONTAINER = "dcontain";
    var CLASS_NAME_P_DATE = "pdate";
    var CLASS_NAME_P_LUNAR = "plunar";
    var CLASS_NAME_WEEKEND = "weekend";
    var CLASS_NAME_DOT = "dot";
    var CLASS_NAME_WHITE_DOT = "white-dot";

    clearMonthCalendar(tableObj);

    var calendar = new Calendar(year, month);
    calendar.makeCalendar(false);
    var offset = calendar.firstDayOffset;
    var lunarHelper = new LunarHelper();

    var row, col, objTr, objTd;
    var calIndex = 0, dateObj;
    for(row = 0; row<5; row++){
        objTr = document.createElement("tr");
        objTr.className = CLASS_NAME_TR;
        for(col=0; col<7; col++){
            if(calIndex >= calendar.caldates.length)
                break;
            objTd = document.createElement("td");
            objTd.className = CLASS_NAME_TD;
            if(row == 0 && col < offset){
                //空格
                objTr.appendChild(objTd);
            } else {
                dateObj = calendar.caldates[calIndex++];
                if(typeof dateObj == 'undefined')
                    console.log(calIndex);

                var divObj = document.createElement("div");
                divObj.className = CLASS_NAME_DIV_CONTAINER;
                if(dateObj.isToday()){
                    divObj.className += " "+CLASS_NAME_TODAY;
                }
                var pObj = document.createElement("p");
                pObj.className = CLASS_NAME_P_DATE;
                pObj.innerHTML = dateObj.day;
                divObj.appendChild(pObj);
                pObj = document.createElement("p");
                pObj.className = CLASS_NAME_P_LUNAR;
                pObj.innerHTML = lunarHelper.getLunarDayStr(dateObj.lunarMonth, dateObj.lunarDay);
                divObj.appendChild(pObj);
                objTd.appendChild(divObj);
                if(col == 0 || col == 6){
                    //weekends
                    objTd.className += " " + CLASS_NAME_WEEKEND;
                }
                //事件小点
                var eventDotObj = document.createElement("div");
                eventDotObj.className = CLASS_NAME_DOT;
                if(dateObj.events.length <= 0){
                    eventDotObj.className += " " + CLASS_NAME_WHITE_DOT;
                }
                objTd.appendChild(eventDotObj);

                objTr.appendChild(objTd);
            }
        }
        tableObj.appendChild(objTr);
    }
    return calendar; //供节假日显示调用
}