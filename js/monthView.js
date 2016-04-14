/**月视图
 */

selectedDay = -1;
CLASS_NAME_DIV_CONTAINER = "dcontain";
CLASS_NAME_DIV_CONTAINER_SELECTED = "selected";
calendarObj = null;

function makeMonthView(year, month, day){
    if(year <= 1900 || month < 1|| month > 12 || day<1 || day>31) {
        console.log("year/month is illegal, reset to 1992/03");
        year = 1992;
        month = 3;
        day = 29;
    }
    
    selectedDay = -1;
    //Make Calendar
    var tableObj = document.getElementById("calendar");
    calendarObj = makeMonthCalendar(tableObj, year, month);
    //Make Title
    var headerObj = document.getElementById("month_title");
    makeMonthHeader(headerObj, year, month);
    //Make Event View
    var eventObj = document.getElementById("events");
    makeEventsView(eventObj, calendarObj.caldates[day-1]);
}

function selectDay(){
    //TODO: 选择了某天，月视图中增加黑色圆背景，切换到当天的事件视图
    var divObj = this.firstChild;
    var tableChildren = document.getElementById("calendar").childNodes;
    if(selectedDay != -1
        && ((calendarObj.isCurrentYearMonth && selectedDay != new Date().getDate())
            || !calendarObj.isCurrentYearMonth)){
        //清除原有状态
        var i, offset, breakFlag = false;
        for(i=0; i<tableChildren.length; i++){
            if (tableChildren[i].tagName == null
                || tableChildren[i].tagName.toLowerCase() != 'tr'){
                continue;
            }
            var trChildren = tableChildren[i].childNodes;
            for(offset = 0; offset<7; offset++){
                if(trChildren[offset].hasChildNodes()) {
                    breakFlag = true;
                    break;
                }
            }
            if(breakFlag)
                break;
        }
        var row = i + Math.floor((selectedDay + offset - 1) / 7);
        var col = (selectedDay + offset - 1) % 7;
        var selectedDiv = tableChildren[row].childNodes[col].firstChild;
        selectedDiv.className = CLASS_NAME_DIV_CONTAINER;
    }
    selectedDay = parseInt(this.firstChild.firstChild.innerHTML);
    if((calendarObj.isCurrentYearMonth && selectedDay != new Date().getDate())
        || !calendarObj.isCurrentYearMonth){
        this.firstChild.className += " " + CLASS_NAME_DIV_CONTAINER_SELECTED;
    }
    var eventObj = document.getElementById("events");
    makeEventsView(eventObj, calendarObj.caldates[selectedDay-1]);
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

    var CLASS_NAME_P_DATE = "pdate";
    var CLASS_NAME_P_LUNAR = "plunar";
    var CLASS_NAME_P_LUNAR_START = "lunar-start";
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
                    divObj.className += " " + CLASS_NAME_TODAY;
                }
                var pObj = document.createElement("p");
                pObj.className = CLASS_NAME_P_DATE;
                pObj.innerHTML = dateObj.day;
                divObj.appendChild(pObj);
                pObj = document.createElement("p");
                pObj.className = CLASS_NAME_P_LUNAR;
                if(dateObj.lunarDay == 1){
                    //农历每个月第一天
                    pObj.className += " " + CLASS_NAME_P_LUNAR_START;
                }
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
                objTd.addEventListener("click", selectDay);
                objTr.appendChild(objTd);
            }
        }
        tableObj.appendChild(objTr);
    }
    return calendar; //供节假日显示调用
}

function clearEventView(eventObj) {
    var childNodes = eventObj.childNodes;
    for(var i=childNodes.length-1; i>=0; i--){
        eventObj.removeChild(childNodes[i]);
    }
}

function makeMinuteStr(min){
    var str = ":";
    if(min == 0){
        str += "00";
    } else if(min < 10){
        str += "0" + min;
    } else {
        str += min;
    }
    return str;
}

function makeEventsView(eventObj, dateObj){
    var CLASS_NAME_LI = "event-li";
    var CLASS_NAME_LEFT_DIV = "event-time";
    var CLASS_NAME_RIGHT_DIV = "event-str";
    var CLASS_NAME_GREY_TEXT = "grey";
    //事件视图
    //TODO:默认有7个事件槽
    clearEventView(eventObj);
    var events = dateObj.events;
    var i, liObj;
    for(i=0; i<events.length; i++){
        var liObj = document.createElement("li");
        liObj.className = CLASS_NAME_LI;
        /*Left div*/
        var leftDivObj = document.createElement("div");
        leftDivObj.className = CLASS_NAME_LEFT_DIV + " "+ events[i].type;
        //pStartTime
        var pStartObj = document.createElement("p");    //#event-time > p
        pStartObj.innerHTML = "全天";
        if(!events[i].isFullday){
            pStartObj.innerHTML = events[i].timeStart.getHours() + makeMinuteStr(events[i].timeStart.getMinutes());
        }
        leftDivObj.appendChild(pStartObj);
        //pEndTime
        if(!events[i].isFullday){
            var pEndObj = document.createElement("p");
            pEndObj.className = CLASS_NAME_GREY_TEXT;
            pEndObj.innerHTML = events[i].timeEnd.getHours() + makeMinuteStr(events[i].timeEnd.getMinutes());
            leftDivObj.appendChild(pEndObj);
        }
        liObj.appendChild(leftDivObj);

        /*Right div*/
        var rightDivObj = document.createElement("div");
        rightDivObj.className = CLASS_NAME_RIGHT_DIV;
        rightDivObj.innerHTML = events[i].desc;
        liObj.appendChild(rightDivObj);

        eventObj.appendChild(liObj);
    }

    for(; i<7; i++){
        //Empty row
        var liObj = document.createElement("li");
        liObj.className = CLASS_NAME_LI;
        eventObj.appendChild(liObj);
    }
}