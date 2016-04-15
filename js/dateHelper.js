function Calendar(year, month){
	this.year = year;
	this.month = month;
	this.caldates = Array();
	this.firstDayOffset; //当月第一天的偏移量(周日:0，周一:1，...)
	this.isCurrentYearMonth = false;
}
Calendar.prototype = {
	daysOfMonth : Array(31, -1, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31), //二月份后面算闰年
	makeCalendar : function(simplified){
		//生成这个月的Calendar
		//simplified: 简化版，只有日期，没有农历和节假日等信息
		var daysMon = this.daysOfMonth[this.month-1];
		if(daysMon == -1){
			//奇怪的二月份
			if(this.year%100 == 0){
				if(this.year%400 == 0)
					daysMon = 29;
				else
					daysMon = 28;
			} else if(this.year%4 == 0){
				daysMon = 29;
			} else {
				daysMon = 28;
			}
		}
		this.firstDayOffset = new Date(this.year, this.month-1, 1).getDay();
		if(!simplified){
			var solarTermStr = new LunarHelper().getSolarTermStr(this.year, this.month);
		}

		var i, cal;
		for(i=1; i<=daysMon; i++){
			cal = new CalDate(this.year, this.month, i);
			if(!simplified){
				cal.makeDate();
				if(cal.isToday()){
					this.isCurrentYearMonth = true;
				}
				var eventObj;
				if(solarTermStr[0] == i){
					//cal.events[cal.events.length] = solarTermStr[1];
					eventObj = new CalEvent(CalEvent.prototype.TYPE_SOLAR_TERM, solarTermStr[1]);
					cal.events[cal.events.length] = eventObj;
				} else if(solarTermStr[2] == i){
					//cal.events[cal.events.length] = solarTermStr[3];
					eventObj = new CalEvent(CalEvent.prototype.TYPE_SOLAR_TERM, solarTermStr[3]);
					cal.events[cal.events.length] = eventObj;
				}
			}
			this.caldates[this.caldates.length] = cal;
		}
	}
}


function CalDate(year, month, day){
	//Date对象，包含农历、公历日期以及节假日信息
	this.year = year;
	this.month = month;
	this.day = day;

	this.week = new Date(this.year, this.month-1, this.day).getDay();

	this.lunarYear;
	this.lunarMonth;
	this.isLeapMonth; //是否农历闰月
	this.lunarDay;
	this.solarTerm;	  //农历节气，在MonthCalendar里面算

	this.events = new Array(); //存储当前的事件
}
CalDate.prototype.makeDate = function(){
	//根据公历年月日推算其他信息
	//TODO: 节假日事件的添加
	var thisDate = new Date(this.year, this.month-1, this.day);
	var baseDate = new Date(1900, 0, 31);
	var offset = (thisDate - baseDate)/86400000;	//按天计算
	var lunarHelper = new LunarHelper();

	var i, temp=0;
	for(i = 1900; i<2050 && offset>0; i++){
		//从1900年至今的月份数累加
		temp = lunarHelper.daysOfYear(i);
		offset -= temp;
	}
	if(offset < 0) {
		offset += temp;
		i--;
	}
	this.lunarYear = i;
	var leapMonth = lunarHelper.getLeapMonth(this.lunarYear);
	var leapFlag = false;
	for(i = 1; i<13 && offset>0; i++){
		if(leapMonth>0 && i==(leapMonth+1) && leapFlag==false){
			//当前月是闰月
			i--; //还有一个非闰月的相同月份
			leapFlag = true;
			temp = lunarHelper.daysOfLeapMonth(this.lunarYear); //闰月天数
		} else {
			temp = lunarHelper.daysOfMonth(this.lunarYear, i); //这个月的天数
		}

		if(leapFlag && i==(leapMonth+1))
			leapFlag = false; //计算完成，取消闰月状态
		offset -= temp;
	}
	if(offset == 0 && leapMonth > 0 && i == leapMonth+1) {
		if(leapFlag){
			leapFlag = false;
		} else {
			leapFlag = true;
			i--;
		}
	}
	if(offset < 0){
		offset += temp;
		i--;
	}
	this.lunarMonth = i;
	this.lunarDay = offset + 1;
	this.isLeapMonth = leapFlag;

	//添加节假日事件
	var eh = new EventHelper();
	var eventStr = eh.getPublicHoliday(this.year, this.month, this.day);
	var eventObj;
	if(null != eventStr){
		eventObj = new CalEvent(CalEvent.prototype.TYPE_PUBLIC_HOLIDAY, eventStr);
		this.events[this.events.length] = eventObj;
		//this.events[this.events.length] = eventStr;
	}
	eventStr = eh.getLunarHoliday(this.lunarMonth, this.lunarDay);
	if(null != eventStr){
		//this.events[this.events.length] = eventStr;
		eventObj = new CalEvent(CalEvent.prototype.TYPE_LUNAR_HOLIDAY, eventStr);
		this.events[this.events.length] = eventObj;
	}
}
CalDate.prototype.isToday = function () {
    var today = new Date();
    if((today.getFullYear() == this.year)
        && (today.getMonth()+1 == this.month)
        && (today.getDate() == this.day)){
        return true;
    }
    return false;
}


function CalEvent(type, desc){
	this.type = type;
	this.desc = desc;
	this.isFullday = true; //默认是全天事件
	this.timeStart;	//date对象
	this.timeEnd;	//date对象
}
CalEvent.prototype = {
	TYPE_PUBLIC_HOLIDAY: "public-holiday",
	TYPE_LUNAR_HOLIDAY: "lunar-holiday",
	TYPE_SOLAR_TERM: "solar-term",
	setTimeSpan : function (startDateObj, endDateObj) {
		this.isFullday = false;
		this.timeStart = startDateObj;
		this.timeEnd = endDateObj;
	}
}

function EventHelper(){
	//节假日

}
EventHelper.prototype = {
	constructor : EventHelper,
	publicHolidays : new Array("0101 元旦", "0214 情人节", "0308 妇女节", "0312 植树节",
							"0315 消费者权益日", "0401 愚人节", "0501 劳动节", "0504 青年节",
							"0512 护士节", "0601 儿童节", "0701 建党节", "0801 建军节",
							"0910 教师节", "0928 孔子诞辰", "1001 国庆节", "1006 老人节",
							"1024 联合国日", "1224 平安夜", "1225 圣诞节"),
	lunarHolidays : new Array("0101 春节", "0115 元宵", "0505 端午", "0707 七夕",
							"0715 中元", "0815 中秋", "0909 重阳", "1208 腊八",
							"1224 小年"),
	getPublicHoliday : function(year, month, day){
		//返回当前的公共假日信息. month以1开始
		var i;
		var m, d;
		for(i=0; i<this.publicHolidays.length; i++){
			//遍历已有的节日
			m = parseInt(this.publicHolidays[i].substr(0,2));
			d = parseInt(this.publicHolidays[i].substr(2,4));
			if(month == m && day == d){
				return this.publicHolidays[i].substr(5);
			}
		}
		m = null; d = null;
		//处理父亲节、母亲节
		var weekd = new Date(year, month-1, day).getDay();
		if(month == 6 && weekd == 0){
			if(day-14 > 0 && day-14 < 7)
				return "父亲节";
		} else if(month == 5 && weekd == 0){
			if(day-7 > 0 && day-7 < 7)
				return "母亲节";
		}
		return null;
	},
	getLunarHoliday : function(lunarMonth, lunarDay) {
		//获得农历节气
		var i, m, d;
		for(i=0; i<this.lunarHolidays.length; i++){
			m = parseInt(this.lunarHolidays[i].substr(0,2));
			d = parseInt(this.lunarHolidays[i].substr(2,4));
			if(lunarMonth == m && lunarDay == d){
				return this.lunarHolidays[i].substr(5);
			}
		}
		return null;
	}
}



function LunarHelper(){
	//农历
}
LunarHelper.prototype = {
	constructor : LunarHelper,
	lunarInfo : new Array(
				0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
				0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
				0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
				0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
				0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
				0x06ca0,0x0b550,0x15355,0x04da0,0x0a5d0,0x14573,0x052d0,0x0a9a8,0x0e950,0x06aa0,
				0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
				0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b5a0,0x195a6,
				0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
				0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,
				0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
				0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
				0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
				0x05aa0,0x076a3,0x096d0,0x04bd7,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
				0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0),
	lunarStr1 : new Array('日','一','二','三','四','五','六','七','八','九','十'),
	lunarStr2 : new Array('初','十','廿','卅'),
	solarTerms : new Array("小寒","大寒","立春","雨水","惊蛰","春分","清明","谷雨","立夏","小满","芒种",
				"夏至","小暑","大暑","立秋","处暑","白露","秋分","寒露","霜降","立冬","小雪","大雪","冬至"),
	solarTermOffsets: new Array(0,21208,42467,63836,85337,107014,128867,150921,173149,195551,218072,
					240693,263343,285989,308563,331033,353350,375494,397447,419210,440795,462224,483532,504758),
	zodiacs : new Array("鼠","牛","虎","兔","龙","蛇","马","羊","猴","鸡","狗","猪"),
    lunarMonthStr : new Array("正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "冬", "腊"),
	getLeapMonth : function(year){
		//判断year年哪个月是闰月，没有闰月返回0
		return (this.lunarInfo[year-1900] & 0xf);
	},
	daysOfLeapMonth : function(year){
		//农历year年闰月的天数
		if(this.getLeapMonth(year))
			return ((this.lunarInfo[year-1900] & 0x10000)? 30:29);
		else
			return 0;
	},
	daysOfYear : function(year){
		//农历year年的总天数
		var i, sum = 348;
		for(i = 0x8000; i>0x8; i>>=1)
			sum += (this.lunarInfo[year-1900] & i)? 1 : 0;
		return sum + this.daysOfLeapMonth(year);
	},
	daysOfMonth: function(year, month){
		//农历year年month月的总天数
		return ((this.lunarInfo[year-1900] & (0x10000>>month))? 30:29);
	},
	getLunarDayStr : function(month, day){
		//数字日期转农历日期（初三、三十、...）
		var str;
        if(day == 1){
            str = this.lunarMonthStr[month-1] + "月";
            return str;
        }
		switch(day) {
			case 10:
				str = '初十';
				break;
			case 20:
				str = '二十';
				break;
			case 30:
				str = '三十';
				break;
			default:
				str = this.lunarStr2[Math.floor(day/10)]
				str += this.lunarStr1[day%10];
		}
		return str;
	},
	getSolarTermDay : function(year, seqNumOfTerm){
		//某年(公历)的第n个节气是第几天（0是小寒）
		var date = new Date((31556925974.7 * (year-1900)
			+ this.solarTermOffsets[seqNumOfTerm] * 60000) + Date.UTC(1900,0,6,2,5));
		return date.getUTCDate();
	},
	getSolarTermStr : function(year, month) {
		//获得公历year年month月(1,2,...)的农历信息
		//返回Array类型，day1, term1, day1, term2, ...
		month = month - 1;
		var day1 = this.getSolarTermDay(year, month*2);
		var termStr1 = this.solarTerms[month*2];
		var day2 = this.getSolarTermDay(year, month*2 + 1);
		var termStr2 = this.solarTerms[month*2+1];
		return new Array(day1, termStr1, day2, termStr2);
	},
	getZodiacStr : function(year){
		//TODO:农历年份返回生肖
	}
}

