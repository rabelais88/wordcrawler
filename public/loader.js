$(function(){
  $.getJSON('ajax.json',(res)=>{
    console.log(res);
    $('#time').html(res.time);
    res.result.forEach((elRes)=>{
      $('#wordrank').append(`<p><a href='https://search.naver.com/search.naver?query=${elRes[0]}' class='word' style='font-size:${15 + elRes[1] * 2}px;'>${elRes[0]} 빈도수 ${elRes[1]} 회</a></p>`);
      $('#wordrank').append('<ul>');
      elRes[2].forEach((elTitle)=>{
        $('#wordrank').append(`<li>${elTitle}</li>`)
      })
      $('#wordrank').append('</ul>');
    })
  })
})