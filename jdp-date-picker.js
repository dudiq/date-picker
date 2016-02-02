(function(){

    var default_month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    var CONST_VIEW_TYPES = "jdp-view-type-";

    function logError(msg){
        if (window['console']){
            console.error('jdp-calendar-error: ' + msg);
        }
    }

    function datePicker(el, params){
        if (el.length != 1){
            logError('picker does not work with more than one element!');
            return false;
        }
        params = params || {};

        this._params = params;

        var cont = this._container = $("<div class='jdp-container'>");

        createMonthContainer.call(this);
        createYearContainer.call(this);


        var contTime = this._containerTime = $("<div class='jdp-container-time'>");
        cont.append(contTime);

        createHoursContainer.call(this);
        createMinsContainer.call(this);

        var viewType = 'days';
        if (params.doNotShowDays){
            viewType = 'months';
        }
        setClass(this._container, 'view-type', CONST_VIEW_TYPES + viewType);


        this.setDate(params.date);

        if (params.doNotShowTime || params.doNotShowDays){
            el.addClass('jdp-do-not-show-time');
        }

        bindEvents.call(this);

        el.append(cont);
    }

    var CONST_ACTIVE_MIN = 'active-min';
    var CONST_ACTIVE_HOUR = 'active-hour';
    var CONST_ACTIVE_DAY = 'active-day';
    var CONST_ACTIVE_MONTH = 'active-month';
    var CONST_ACTIVE_YEAR = 'active-year';

    var t_ms = 1;
    var t_sec = t_ms * 1000;
    var t_min = t_sec * 60;
    var t_hour = t_min * 60;
    var t_day = t_hour * 24;
    var t_week = t_day * 7;

    var p = datePicker.prototype;

    p.setDate = function(dateValue){
        var date = this._date = dateValue ? new Date(dateValue) : new Date();
        this._viewDate = new Date(date);
        updateCalendar.call(this);
    };

    p.getDate = function(){
        return this._date;
    };

    p.destroy = function(){
        if (!this._container){
            this._container.detach();
            this._monthCont.remove();
            this._monthCont = null;
            this._yearCont.remove();
            this._yearCont = null;
            this._date = null;
            this._viewDate = null;
            this._params = null;
            this._container.remove();
            this._container = null;
        }
    };

    function updateCalendar(){
        var vDate = this._viewDate;

        // update title
        var year = vDate.getFullYear();
        var month = vDate.getMonth();

        var monthTexts = this._params.monthTexts || default_month;
        var topTitle = monthTexts[month] + ' ' + year;
        this._monthTitle.html(topTitle);

        this._yearTitle.html(vDate.getFullYear());

        defineMonth.call(this, vDate);
        updateActiveDate.call(this, vDate);
        updateActiveMonth.call(this, vDate);
        updateActiveHours.call(this, vDate);
        updateActiveMins.call(this, vDate);
    }

    function bindEvents(){
        var self = this;
        var cont = this._container;
        var hasTouch = ("ontouchend" in document);
        !hasTouch && cont.addClass('jdp-not-touch');

        var evName = $.event.special.jrclick ? "jrclick" : (hasTouch ? "touchstart" : "click");
        cont.on(evName, {longClick: 300}, function(ev){
            var target = $(ev.target);
            if (target.hasClass('jdp-day-item')) {
                // processing day click
                var day = target.data("num");
                setDay.call(self, day);
            } else if (target.hasClass('jdp-month-item')) {
                // processing month click
                var month = target.data("num");
                setMonth.call(self, month);
            } else if (target.hasClass('jdp-hour-item')) {
                // processing hour click
                var hour = target.data('num');
                setHour.call(self, hour);
            } else if (target.hasClass('jdp-min-item')) {
                // processing min click
                var min = target.data('num');
                setMin.call(self, min);

            } else if (target.hasClass('jdp-top-navi')) {
                // goto next/prev month
                var isNext = target.hasClass('jdp-next');
                if (target.hasClass('jdp-month-navi')){
                    // in moth
                    navigateMonth.call(self, isNext);
                } else if (target.hasClass('jdp-year-navi')){
                    // in year
                    navigateYear.call(self, isNext);
                }
            } else if (target.hasClass('jdp-month-title')){
                // change days to month
                setClass(self._container, 'view-type', CONST_VIEW_TYPES + 'months');
            } else if (target.hasClass('jdp-year-title') && !self._params.doNotShowDays){
                // change days to month
                setClass(self._container, 'view-type', CONST_VIEW_TYPES + 'days');
            }
        });
    }

    function onChanged(){
        var lastVal = this._lastVal;
        var trigValue = new Date(this._date);
        var canTrig = false;
        if (lastVal){
            if (lastVal.getTime() != trigValue.getTime()){
                canTrig = true;
            }
        } else {
            canTrig = true;
        }
        this._lastVal = trigValue;

        canTrig && callEvent.call(this, 'onChanged', trigValue);
    }

    function navigateYear(isNext){
        var date = this._viewDate;
        var year = date.getFullYear();

        year = (isNext) ? year + 1 : year - 1;

        date.setFullYear(year);

        this._viewDate = date;

        updateCalendar.call(this);
    }

    function setDay(num){
        var vDate = this._viewDate;
        var month = vDate.getMonth();
        var year = vDate.getFullYear();
        var date = this._date;
        date.setDate(3);
        date.setMonth(month);
        date.setFullYear(year);
        date.setDate(num + 1);
        updateCalendar.call(this);
        onChanged.call(this);
    }

    function setMonth(num){
        var date = this._viewDate;
        var currDay = date.getDate();
        date.setDate(3);
        date.setMonth(num);
        var daysInMonth = getDaysInMonth(date);
        if (currDay > daysInMonth){
            date.setDate(daysInMonth);
        } else {
            date.setDate(currDay);
        }
        this._viewDate = date;
        if (this._params.doNotShowDays){
            setDay.call(this, 1);
        } else {
            updateCalendar.call(this);
        }
    }

    function setHour(num){
        //num++;
        (num >= 24) && (num = 0);
        var vDate = this._viewDate;
        var date = this._date;
        date.setHours(num);
        vDate.setHours(num);
        updateCalendar.call(this);
        onChanged.call(this);
    }

    function setMin(num){
        var vDate = this._viewDate;
        var date = this._date;
        date.setMinutes(num);
        vDate.setMinutes(num);
        updateCalendar.call(this);
        onChanged.call(this);
    }

    function navigateMonth(isNext){
        var date = this._viewDate;
        var daysInMonth = getDaysInMonth(date);
        var currDay = date.getDate();

        var addMs = (isNext ? (daysInMonth - currDay + 3) : - currDay - 3) * t_day;

        date = this._viewDate = new Date(date.getTime() + addMs);

        updateCalendar.call(this);
    }

    function callEvent(evName, arg){
        var params = this._params;
        if (params[evName]){
            params[evName](arg);
        }
    }

    function defineMonth(date){
        var monthCont = this._monthCont;
        var currWeekDay = date.getDay();
        var currDay = date.getDate();
        var fakes = (currDay % 7) - currWeekDay;
        (fakes < 0) && (fakes = 7 + fakes);

        var fakesClass = 'jdp-fake-day-' + fakes;
        setClass(monthCont, 'fake-days', fakesClass);

        defineMonthDays.call(this, date);
        defineWeekSplit.call(this, fakes);
    }

    function defineMonthDays(date){
        var daysInMonth = getDaysInMonth(date);

        var daysInMonthClass = 'jdp-month-days-' + daysInMonth;
        setClass(this._monthCont, 'month-days', daysInMonthClass);
    }

    function defineWeekSplit(fakes){
        var weekClass = 'jdp-weeks-split-' + fakes;
        setClass(this._monthCont, 'weeks-split', weekClass);
    }

    function removeByDataKey(cont, cssKey, key){
        var last = cont.data(key);

        if (last !== undefined){
            var el = cont.find('.jdp-'+ cssKey +'-' + last);
            el.removeClass('jdp-active-' + cssKey);
        }
    }

    function addByDataKey(cont, cssKey, key, val){
        var el = cont.find('.jdp-'+cssKey+'-' + val);
        el.addClass('jdp-active-' + cssKey);
        cont.data(key, val);
    }

    function updateActiveMonth(date){
        var yearCont = this._yearCont;
        removeByDataKey(yearCont, 'month', CONST_ACTIVE_MONTH);

        var vDate = this._viewDate;

        var currMonth = vDate.getMonth();
        addByDataKey(yearCont, 'month', CONST_ACTIVE_MONTH, currMonth);
    }

    function updateActiveDate(date){
        var monthCont = this._monthCont;
        removeByDataKey(monthCont, 'day', CONST_ACTIVE_DAY);

        var vDate = this._date;

        if ((date.getMonth() == vDate.getMonth()) && (date.getFullYear() == vDate.getFullYear())){
            var currDay = vDate.getDate() - 1;
            addByDataKey(monthCont, 'day', CONST_ACTIVE_DAY, currDay);
        }
    }

    function updateActiveHours(date){
        var hoursCont = this._hoursCont;
        removeByDataKey(hoursCont, 'hour', CONST_ACTIVE_HOUR);

        var vDate = this._date;

        var currHour = vDate.getHours();
        addByDataKey(hoursCont, 'hour', CONST_ACTIVE_HOUR, currHour);
    }

    function updateActiveMins(date){
        var minsCont = this._minsCont;
        removeByDataKey(minsCont, 'min', CONST_ACTIVE_MIN);

        var vDate = this._date;

        var currMin = vDate.getMinutes();
        var dx = (currMin % 5);
        currMin = currMin - dx;
        addByDataKey(minsCont, 'min', CONST_ACTIVE_MIN, currMin);
    }

    function createHoursContainer(){
        var cont = this._containerTime;
        var hoursCont = this._hoursCont = $("<div class='jdp-hours-container'>");
        var innerContent = "";

        // header
        var headerDiv =
            "<div class='jdp-top'>" +
            "<div class='jdp-top-title'><div class='jdp-hours-title jdp-title'></div></div>" +
            "</div>";
        innerContent += headerDiv;

        for (var i = 0, l = 24; i < l; i++){
            var item = "<div class='jdp-hour-item jdp-hour-" + i + "' data-num='"+ i +"'>" + (i) + "</div>";
            if ((i + 1) % 4 == 0){
                item += "<div class='jdp-hours-split'></div>";
            }
            innerContent += item;
        }
        hoursCont[0].innerHTML = innerContent;

        cont.append(hoursCont);

    }

    function createMinsContainer(){
        var cont = this._containerTime;
        var minsCont = this._minsCont = $("<div class='jdp-mins-container'>");
        var innerContent = "";

        // header
        var headerDiv =
            "<div class='jdp-top'>" +
            "<div class='jdp-top-title'><div class='jdp-mins-title jdp-title'></div></div>" +
            "</div>";
        innerContent += headerDiv;

        var min = 0;
        for (var i = 0, l = 12; i < l; i++){
            var minText = (min < 10) ? "0" + min : min;
            var item = "<div class='jdp-min-item jdp-min-" + min + "' data-num='"+ min +"'>" + minText + "</div>";
            if ((i + 1) % 2 == 0){
                item += "<div class='jdp-mins-split'></div>";
            }
            innerContent += item;
            min += 5;
        }
        minsCont[0].innerHTML = innerContent;

        cont.append(minsCont);
    }

    function createMonthContainer(){
        var cont = this._container;
        var monthCont = this._monthCont = $("<div class='jdp-month-container'>");
        var innerContent = "";

        // header
        var headerDiv =
            "<div class='jdp-top'>" +
                "<div class='jdp-top-title'><div class='jdp-month-title jdp-title'></div></div>" +
                "<div class='jdp-back jdp-top-navi jdp-month-navi'></div>" +
                "<div class='jdp-next jdp-top-navi jdp-month-navi'></div>" +
            "</div>";
        innerContent += headerDiv;

        // content
        var splits = 0;

        for (var i = 0, l = 7; i < l; i++){
            var itemFake = "<div class='jdp-day-item jdp-fake-day-item jdp-fake-day-" + i + "'></div>" + addWeekSplit(splits);
            innerContent += itemFake;
            splits++;
        }

        for (var i = 0, l = 31; i < l; i++){
            var item = "<div class='jdp-day-item jdp-day-" + i + "' data-num='"+ i +"'>" + (i + 1) + "</div>" + addWeekSplit(splits);
            innerContent += item;
            splits++;
        }
        monthCont[0].innerHTML = innerContent;

        this._monthTitle = monthCont.find('.jdp-month-title');

        cont.append(monthCont);
    }

    function addWeekSplit(splits){
        return "<div class='jdp-week-split jdp-week-split-" + splits + "'></div>";
    }

    function createYearContainer(el){
        var cont = this._container;
        var yearCont = this._yearCont = $("<div class='jdp-year-container'>");
        var innerContent = "";

        // header
        var headerDiv =
            "<div class='jdp-top'>" +
                "<div class='jdp-top-title'><div class='jdp-year-title jdp-title'></div></div>" +
                "<div class='jdp-back jdp-top-navi jdp-year-navi'></div>" +
                "<div class='jdp-next jdp-top-navi jdp-year-navi'></div>" +
            "</div>";
        innerContent += headerDiv;

        for (var i = -1, l = 11; i < l; i++){
            var pos = i;
            (i == -1) && (pos = 11);
            var item = "<div class='jdp-month-item jdp-month-" + pos + "' data-num='"+ pos +"'></div>";
            if ((pos - 1) % 3 == 0){
                item += "<div class='jdp-months-split'></div>";
            }
            innerContent += item;
        }
        yearCont[0].innerHTML = innerContent;

        this._yearTitle = yearCont.find('.jdp-year-title');
        cont.append(yearCont)
    }


    /*helpers*/


    function setClass(el, key, newClass){
        var dataVal = el.data(key);
        dataVal && el.removeClass(dataVal);

        el.addClass(newClass);
        el.data(key, newClass);
    }


    function getDaysInMonth(date){
        var here = new Date(date.getTime());
        here.setDate(32);
        return 32 - here.getDate();

    }

    window['jrDatePicker'] = datePicker;

})();
