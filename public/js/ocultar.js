$(document).ready(function(){

	$(window).scroll(function(){
		if( $(this).scrollTop() > 0 ){
			$('.contenido').slideDown(300);
		} else {
			$('.contenido').slideUp(300);
		}
	});

});
