var $currentPopover = null;
  $(document).on('shown.bs.popover', function (ev) {
    var $target = $(ev.target);
    if ($currentPopover && ($currentPopover.get(0) != $target.get(0))) {
      $currentPopover.popover('toggle');
    }
    $currentPopover = $target;
  }).on('hidden.bs.popover', function (ev) {
    var $target = $(ev.target);
    if ($currentPopover && ($currentPopover.get(0) == $target.get(0))) {
      $currentPopover = null;
    }
  });



$.extend({
    quicktmpl: function (template) {return new Function("obj","var p=[],print=function(){p.push.apply(p,arguments);};with(obj){p.push('"+template.replace(/[\r\t\n]/g," ").split("{{").join("\t").replace(/((^|\}\})[^\t]*)'/g,"$1\r").replace(/\t:(.*?)\}\}/g,"',$1,'").split("\t").join("');").split("}}").join("p.push('").split("\r").join("\\'")+"');}return p.join('');")}
});

$.extend(Date.prototype, {
  //предоставляет строку _year_month_day, предназначенную для широкого использования в качестве css-класса
  toDateCssClass:  function () { 
    return '_' + this.getFullYear() + '_' + (this.getMonth() + 1) + '_' + this.getDate(); 
  },
  //это генерирует число, полезное для сравнения двух дат;
  toDateInt: function () { 
    return ((this.getFullYear()*12) + this.getMonth())*32 + this.getDate(); 
  },
  toTimeString: function() {
    var hours = this.getHours(),
        minutes = this.getMinutes(),
        hour = (hours > 12) ? (hours - 12) : hours,
        ampm = (hours >= 12) ? ' pm' : ' am';
    if (hours === 0 && minutes===0) { return ''; }
    if (minutes > 0) {
      return hour + ':' + minutes + ampm;
    }
    return hour + ampm;
  }
});


(function ($) {

  ////существует функция, которая получает переданный объект options и возвращает строку html. Я использую quicktmpl для его создания на основе шаблона, расположенного в блоке html
  var t = $.quicktmpl($('#tmpl').get(0).innerHTML);
  
  function calendar($el, options) {
    //действия в настоящее время отсутствуют в шаблоне, но могут быть легко добавлены...
    $el.on('click', '.js-cal-prev', function () {
      switch(options.mode) {
      case 'year': options.date.setFullYear(options.date.getFullYear() - 1); break;
      case 'month': options.date.setMonth(options.date.getMonth() - 1); break;
      case 'week': options.date.setDate(options.date.getDate() - 7); break;
      case 'day':  options.date.setDate(options.date.getDate() - 1); break;
      }
      draw();
    }).on('click', '.js-cal-next', function () {
      switch(options.mode) {
      case 'year': options.date.setFullYear(options.date.getFullYear() + 1); break;
      case 'month': options.date.setMonth(options.date.getMonth() + 1); break;
      case 'week': options.date.setDate(options.date.getDate() + 7); break;
      case 'day':  options.date.setDate(options.date.getDate() + 1); break;
      }
      draw();
    }).on('click', '.js-cal-option', function () {
      var $t = $(this), o = $t.data();
      if (o.date) { o.date = new Date(o.date); }
      $.extend(options, o);
      draw();
    }).on('click', '.js-cal-years', function () {
      var $t = $(this), 
          haspop = $t.data('popover'),
          s = '', 
          y = options.date.getFullYear() - 2, 
          l = y + 5;
      if (haspop) { return true; }
      for (; y < l; y++) {
        s += '<button type="button" class="btn btn-default btn-lg btn-block js-cal-option" data-date="' + (new Date(y, 1, 1)).toISOString() + '" data-mode="year">'+y + '</button>';
      }
      $t.popover({content: s, html: true, placement: 'auto top'}).popover('toggle');
      return false;
    }).on('click', '.event', function () {
      var $t = $(this), 
          index = +($t.attr('data-index')), 
          haspop = $t.data('popover'),
          data, time;
          
      if (haspop || isNaN(index)) { return true; }
      data = options.data[index];
      time = data.start.toTimeString();
      if (time && data.end) { time = time + ' - ' + data.end.toTimeString(); }
      $t.data('popover',true);
      $t.popover({content: '<p><strong>' + time + '</strong></p>'+data.text, html: true, placement: 'auto left'}).popover('toggle');
      return false;
    });
    function dayAddEvent(index, event) {
      if (!!event.allDay) {
        monthAddEvent(index, event);
        return;
      }
      var $event = $('<div/>', {'class': 'event', text: event.title, title: event.title, 'data-index': index}),
          start = event.start,
          end = event.end || start,
          time = event.start.toTimeString(),
          hour = start.getHours(),
          timeclass = '.time-22-0',
          startint = start.toDateInt(),
          dateint = options.date.toDateInt(),
          endint = end.toDateInt();
      if (startint > dateint || endint < dateint) { return; }
      
      if (!!time) {
        $event.html('<strong>' + time + '</strong> ' + $event.html());
      }
      $event.toggleClass('begin', startint === dateint);
      $event.toggleClass('end', endint === dateint);
      if (hour < 6) {
        timeclass = '.time-0-0';
      }
      if (hour < 22) {
        timeclass = '.time-' + hour + '-' + (start.getMinutes() < 30 ? '0' : '30');
      }
      $(timeclass).append($event);
    }
    
    function monthAddEvent(index, event) {
      var $event = $('<div/>', {'class': 'event', text: event.title, title: event.title, 'data-index': index}),
          e = new Date(event.start),
          dateclass = e.toDateCssClass(),
          day = $('.' + e.toDateCssClass()),
          empty = $('<div/>', {'class':'clear event', html:'&nbsp;'}), 
          numbevents = 0, 
          time = event.start.toTimeString(),
          endday = event.end && $('.' + event.end.toDateCssClass()).length > 0,
          checkanyway = new Date(e.getFullYear(), e.getMonth(), e.getDate()+40),
          existing,
          i;
      $event.toggleClass('all-day', !!event.allDay);
      if (!!time) {
        $event.html('<strong>' + time + '</strong> ' + $event.html());
      }
      if (!event.end) {
        $event.addClass('begin end');
        $('.' + event.start.toDateCssClass()).append($event);
        return;
      }
            
      while (e <= event.end && (day.length || endday || options.date < checkanyway)) {
        if(day.length) { 
          existing = day.find('.event').length;
          numbevents = Math.max(numbevents, existing);
          for(i = 0; i < numbevents - existing; i++) {
            day.append(empty.clone());
          }
          day.append(
            $event.
            toggleClass('begin', dateclass === event.start.toDateCssClass()).
            toggleClass('end', dateclass === event.end.toDateCssClass())
          );
          $event = $event.clone();
          $event.html('&nbsp;');
        }
        e.setDate(e.getDate() + 1);
        dateclass = e.toDateCssClass();
        day = $('.' + dateclass);
      }
    }
    function yearAddEvents(events, year) {
      var counts = [0,0,0,0,0,0,0,0,0,0,0,0];
      $.each(events, function (i, v) {
        if (v.start.getFullYear() === year) {
            counts[v.start.getMonth()]++;
        }
      });
      $.each(counts, function (i, v) {
        if (v!==0) {
            $('.month-'+i).append('<span class="badge">'+v+'</span>');
        }
      });
    }
    
    function draw() {
      $el.html(t(options));
      //// потенциальная оптимизация (непроверенная), этот объект может быть введен в словарь в строке класса date; объект должен быть сброшен, и первая запись должна быть сделана здесь
      $('.' + (new Date()).toDateCssClass()).addClass('today');
      if (options.data && options.data.length) {
        if (options.mode === 'year') {
            yearAddEvents(options.data, options.date.getFullYear());
        } else if (options.mode === 'month' || options.mode === 'week') {
            $.each(options.data, monthAddEvent);
        } else {
            $.each(options.data, dayAddEvent);
        }
      }
    }
    
    draw();    
  }
  
  ;(function (defaults, $, window, document) {
    $.extend({
      calendar: function (options) {
        return $.extend(defaults, options);
      }
    }).fn.extend({
      calendar: function (options) {
        options = $.extend({}, defaults, options);
        return $(this).each(function () {
          var $this = $(this);
          calendar($this, options);
        });
      }
    });
  })({
    days: ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"],
    months: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
    shortMonths: ["Янв", "Фев", "Мар", "Апр", "Май", "Июнь", "Июль", "Авг", "Сент", "Окт", "Нояб", "Дек"],
    date: (new Date()),
        daycss: ["c-monday", "", "", "", "", "", "c-sunday"],
        todayname: "Сегодня",
        thismonthcss: "current",
        lastmonthcss: "outside",
        nextmonthcss: "outside",
    mode: "month",
    data: []
  }, jQuery, window, document);
    
})(jQuery);

var data = [],
    date = new Date(),
    d = date.getDate(),
    d1 = d,
    m = date.getMonth(),
    y = date.getFullYear(),
    i,
    end, 
    j, 
    c = 1063, 
    c1 = 3329,
    h, 
    m;
    names = ['Поездка за город', 'День Рождение', 'Уроки', 'Недольшое путешествие', 'Встреча', 'Прогулка', 'Пары', 'Гости'],
    slipsum = ["К сожалению, у меня не получилось отобразить задачи, которые находятся в localStorage в эту таблицу, поэтому я посто сделала названия, которые рандомно ставятся)) Я очень надеюсь на 4)"];
  for(i = 0; i < 500; i++) {
    j = Math.max(i % 15 - 10, 0);
    //c и c1 прыгают вокруг, чтобы создать иллюзию случайных данных
    c = (c * 1063) % 1061; 
    c1 = (c1 * 3329) % 3331;
    d = (d1 + c + c1) % 839 - 440;
    h = i % 36;
    m = (i % 4) * 15;
    if (h < 18) { h = 0; m = 0; } else { h = Math.max(h - 24, 0) + 8; }
    end = !j ? null : new Date(y, m, d + j, h + 2, m);
    data.push({ title: names[c1 % names.length], start: new Date(y, m, d, h, m), end: end, allDay: !(i % 6), text: slipsum[c % slipsum.length ]  });
  }
  
  data.sort(function(a,b) { return (+a.start) - (+b.start); });
  
//данные должны быть отсортированы по дате начала

//На самом деле делать все
$('#holder').calendar({
  data: data
});

//Извлекаем строку Tuskarr JSON из хранилища DOM, преобразуем ее в объект JavaScript и верните его.  Если в хранилище DOM нет Tuskarr,вернет пустой объект JavaScript.
function RetrieveTaskArr( )
{
    var TaskArr_JSON = '',
        TaskArr = {};

    if ( localStorage.getItem('TaskArr') )
    {
        TaskArr_JSON = localStorage.getItem('TaskArr');
        TaskArr      = JSON.parse(TaskArr_JSON);
    }

    return ( TaskArr );

} 
//Преобразовываем Tuskarr в JSON и сохраните его в локальном хранилище DOM.
function SaveTaskArr( TaskArr )
{
    var TaskArr_JSON = JSON.stringify(TaskArr);

    localStorage.setItem('TaskArr', TaskArr_JSON);

} 
//Линейный поиск по массиву задач. Возвращает значение true, если имя какой-либо задачи соответствует заданному имени задачи. В противном случае верните значение false.
function TaskAlreadyExistsinArr( TaskArr, TaskName )
{
    for ( var Task in TaskArr )
    {
        if ( TaskArr[Task].Name == TaskName )
        {
            return ( true );
        }
    }

    return ( false );

} //Удалите задачу из DOM и из локального хранилища DOM.

function RemoveTask( event )
{
    var $this     = $(this),
        DivID     = $this.attr('id'),
        TaskArr   = RetrieveTaskArr(),
        TaskDelim = DivID.indexOf('_'),
        TaskID    = DivID.substring(0, TaskDelim);
    delete TaskArr[TaskID];
    SaveTaskArr( TaskArr );

    if ( localStorage.CurrentTaskID == TaskID )
    {
        //Если задача, которую мы удаляем, имеет текущий идентификатор задачи(clearInterval),остановите таймер и очистите соответствующий IntervalID.
        clearInterval( IntervalID );
        IntervalID = 0;
        localStorage.setItem( 'CurrentTaskID', -1 );
    }
    //Удаляя родительский DIV, мы удаляем всю задачу из DOM.
    $this.parent().remove();
  }

//Добавьте задачу в Tuskarr в локальном хранилище DOM и в DOM.
function AddTask( TaskID, Task )
{
    var CloseButtonDiv,
		DropDiv,
        HoursMinsSecs = {},
        MainTaskDiv,
        Now,
        TaskDiv,
        TaskArr_JSON,
        TaskArr = RetrieveTaskArr(),
        Time = 0,
        TimeSinceLastActivation = 0;
    //Если мы еще не сталкивались с этой задачей, сохраните ее в локальном ВНУТРЕННЕМ хранение.Примечание: задача может находиться в локальном хранилище DOM с предыдущей страницы экземпляр, даже если его нет в DOM.
    if ( !(TaskID in TaskArr) )
    {
        TaskArr[TaskID] = Task;
        SaveTaskArr( TaskArr );
    }
     //Удалите перетаскиваемую задачу из DOM и повторно прикрепите ее в папке dropped.
     $theTask.detach();

     if ( $this.prop('id') === 'top_drop' ) {
         $this.after( $theTask );
     } else {
         $this.parent().after( $theTask );
     }
 
     return( false );
 }
 //Когда задача перетаскивается поверх цели перетаскивания, увеличьте цель — с помощью CSS — до указывает, что задача может быть удалена.
 function activateDropTarget( event )
 {
   event.preventDefault();
   event.stopPropagation();
 
     $(this).prop( "class", "active_drop_target" );
 
   return false;
 }
 //Сжимайте цель перетаскивания при возникновении события "перетаскивания".
 function deactivateDropTarget( event )
 {
   event.preventDefault();
   event.stopPropagation();
 
     $(this).prop( "class", "drop_target" );
 
   return false;
 }
 //Отправить обработчик для формы отправки задачи в верхней части страницы.
 function SubmitTask( event )
 {
     var FormTextField = $( '#Form_TaskName' ),
         StartTimerField = $( '#StartTimer' ),
         StartTimer = StartTimerField.val(),
         TaskArr,
         TaskName   = FormTextField.val(),
         TaskID     = -1;
 
 
     event.preventDefault();
     event.stopPropagation();
     //Очистите поля формы.
     FormTextField.val( '' );
     StartTimerField.val( 0 );
 
     if ( TaskName.length > 0 )
     {
         //Извлеките Tuskarr из локального хранилища DOM и проверьте, является ли это задача уже существует.
         TaskArr = RetrieveTaskArr();
 
         TaskExists = TaskAlreadyExistsinArr( TaskArr, TaskName );
         if ( ! TaskExists )
         {
             //Добавьте задачу в локальное хранилище DOM и в DOM.
             TaskID = NextTaskID();
             AddTask( TaskID,
                       { 'Name'          : TaskName,
                         'Timestamp'     : 0,
                         'TotElapsedTime': 0,
                         'ElapsedSince'  : 0,
                         'TaskActive'    : false } );
 
             if ( StartTimer == 1 )
             {
                 //Пользователь хочет, чтобы таймер запускался после добавления задачи в DOM.  Чтобы запустить таймер, имитируйте событие щелчка на панели задач.
                 $( '#' + TaskID ).trigger( 'click' );
             }
         }
         else
         {
             //Сообщите пользователю, что эта задача уже существует.
             alert( 'Эта задача уже существует!' );
         }
     } 
     return ( TaskID );
 
 } 
 //Запустите, как только DOM будет полностью собран.  Это в основном main().
 $(document).ready(function() {
     var TaskArr,
         TaskID,
         TaskID_int;
 
     localStorage.setItem( 'CurrentTaskID', -1 );
 
     $( '#TrackTimeButton' ).on( 'click', function(event) {
         // Установите значение скрытой формы равным true, чтобы сообщить обработчику задачи отправки, что таймер также должен быть запущен.
         $( '#StartTimer' ).val( 1 );
     });
     // Обработчик отправки для формы задачи.
     $( '#TaskForm' ).submit( SubmitTask );
     // Похоже, что предыдущий экземпляр этой программы запустил некоторые задачи в DOM хранение.  Извлеките и отобразите их.
     TaskArr = RetrieveTaskArr();
     for ( TaskID in TaskArr )
     {
         // TaskId берется из массива, который был сохранен в формате JSON.  Каждый scalar был восстановлен из JSON обратно в строку JavaScript.Итак, преобразуем идентификатор в int.
         TaskID_int = parseInt( TaskID );
 
         AddTask( TaskID, TaskArr[TaskID] );
         if ( TaskID_int >= ID )
         {
             // Установите глобальный идентификатор на единицу больше, чем самый большой идентификатор задачи, который мы нашли в локальном хранилище DOM.
             ID = TaskID_int + 1;
         }
         // Если задача была активна, повторно активируйте ее с помощью имитируемого щелчка
         if ( TaskArr[TaskID].TaskActive == true )
         {
             $( '#' + TaskID ).trigger( 'click' );
         }
     }
     //Активируйте выпадающую цель в верхней части списка задач.
     $( '#top_drop' ).on( 'dragover dragenter', activateDropTarget )
                     .on( 'dragleave', deactivateDropTarget )
                     .on( 'drop', dropOnTarget ); 
     
     
 }); 
 