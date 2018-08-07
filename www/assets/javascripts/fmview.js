var fmview = {};

fmview.prep = function(EWD) {
  fmview.landingPage(EWD);
}; // ~prep

// Main set-up
fmview.landingPage = function(EWD) {
  $.getScript('/ewd-vista/assets/javascripts/select2.js')
  .done( () => {
    $.getScript('/ewd-vista/assets/javascripts/d3.v3.min.js')
    .done( () => {
      $.getScript('/ewd-vista/assets/javascripts/ConceptMap.js')
      .done( () => {
        $.getScript('/ewd-vista/assets/javascripts/treeChart.js')
        .done( () => {
          $('<link>').appendTo('head').attr({
            type: 'text/css',
            rel:  'stylesheet',
            href: '/ewd-vista/assets/stylesheets/select2.css',
          });
          let params = {
            service: 'ewd-vista-fmview',
            name: 'landing.html',
            targetId: 'main-content'
          };
          EWD.getFragment(params, function() {
            initializeConceptMap(EWD).then (
                function (control) {
                    doTheTreeViz(control,EWD);
                }
            );
            fmview.loadingPage(EWD);
          });
        });
      });
    });
  });
}; // ~landingPage

fmview.loadingPage = function(EWD) {
	$("#dynamic-options").append("<form class='navbar-form navbar-left' role='search'> \
			<div class='form-group'> \
				<input type='hidden' id='selectedFile' placeholder='Select File' class='form-control' style='width:300px'> \
			</div> \
			<button type='submit' id='fileBtn' class='btn btn-primary'>Generate</button> \
		</form>");
	$('#dynamic-options').removeClass('invisible');
	fmview.enableSelect2(EWD);
  $('body').on( 'click', '#fileBtn', function(event) {
    event.preventDefault();
    if($('#selectedFile').select2('val')>0){
      fmview.GenerateChart(EWD,$('#selectedFile').select2('val'));
      $("#selectedFile").select2("val", "");
    }
  });
  $('body').on( 'click', '#fileCloseBtn', function(event) {
    event.preventDefault();
    $('#fileContainer').hide();
  });
};
fmview.enableSelect2 = function(EWD) {
	$("#selectedFile").select2({
		minimumInputLength: 1,
		query: function (query) {
			fmview.select2 = {
				callback: query.callback
			};
			let messageObj = {
				service: 'ewd-vista-fmview',
				type: 'fileQuery',
				params: {
					prefix: query.term
				}
			};
			EWD.send(messageObj, (res) => {
				if (res.message.files) {
					fmview.select2.results = res.message.files.results;
					fmview.select2.callback(fmview.select2);
				}
			});
		}
	});
};
fmview.GenerateChart = function(EWD,file) {
  $('#main_Container').html('');
  let messageObj = {
    service: 'ewd-vista-fmview',
    type: 'getFile',
    params: {
      fileId: file
    }
  };
  EWD.send(messageObj, (res) => {
    if (res.message.output) {
      if(res.message.output.error){
            alert(res.message.output.error);
        }else{
            d3GenerationChart.drawChart(res.message.output.results.fileDD,res.message.output.results.name);
            $('#fileContainer').show();
        }
    }
  });
};
