const fs = require('fs')
const request = require('request')
const cheerio = require('cheerio')

const express = require('express')
const path = require('path')
const app = express()

const moment = require('moment-timezone')

const http = require('http').Server(app)

http.listen(process.env.PORT || 3000, function(){
  console.log(`politique crawler is up at ${this.address().port}`)
})

//this part will be replaced with db later...
let resultWord = ''
let resultTime = ''
let resultTitle = ''
let rawData = ''

const preserveData = (data) =>{

  let united = {}
  let titles = []
  //word calculation
  data.map((elData)=>{
    elData.gem.map((elGem)=>{
      if(!united[elGem[0]]){
        united[elGem[0]] = []
        united[elGem[0]][1] = []
        united[elGem[0]][0] = 1
      }else{
        united[elGem[0]][0] ++
      }
      united[elGem[0]][1].push(elGem[1])
    })

    elData.content.map((elTitle)=>{
      titles.push([elTitle,elData.sitename])
    })
  })

  arySort = []
  for (var val in united){
    if(united[val][0] > 1 && val.length > 1){
      arySort.push([
        val,united[val][0],united[val][1]
      ])
    }
  }

  arySort.sort((a,b)=>{
    return b[1] - a[1]
  })
  
  let endTime = moment().tz('Asia/Seoul').format('YYYY-MM-DD hh:ss')
  console.log('data calculated & preserved --- ' + endTime)


  resultTime = endTime
  resultWord = arySort
  resultTitle = titles
  rawData = data
}

const fetchData = (type) => {
  return {result:resultWord,time:resultTime,title:resultTitle}
}

mainCrawl((res)=>{
  preserveData(res)
})

app.use('/public',express.static(path.join(__dirname,'public')))

app.get('/',(req,res)=>{
  fs.readFile('page.html','utf8',(err,html)=>{
    res.send(html)
  })
})

//data is provided in ajax
app.get('/ajax.json',(req,res)=>{
    res.json(fetchData())
})

setInterval(()=>{
  mainCrawl((res)=>{
    preserveData(res)
  })
},1000*60*30) //every 30 minutes, data will be refreshed

function crawl(site){
  return new Promise((resolve,rej)=>{

  const dat = {
    todayhumor:{
      url:'http://todayhumor.co.kr/board/list.php?table=bestofbest',
      tag:'.subject'},
    ruliweb:{
      url:'http://bbs.ruliweb.com/best/selection',
      tag:'.subject'},
    slr:{
      url:'http://slrclub.com/bbs/zboard.php?id=best_article&category=1&setsearch=category',
      tag:'.sbj'},
    inven:{
      url:'http://inven.co.kr/board/powerbbs.php?come_idx=2097&query=list&my=chu&category=&sort=PID&name=&subject=&content=&keyword=&orderby=&iskin=webzine',
      tag:'.bbsSubject'
    },
    dc:{
      url:'http://gall.dcinside.com/board/lists/?id=hit',
      tag:'.t_subject'
    }
  }

    request(dat[site].url,(err,res,html) => {

      const $ = cheerio.load(html,{decodeEntities:false})
      //console.log(html)

      let titles = []
      let trash = []
      let gem = []

      $(dat[site].tag).each((i, el)=>{
        const $el = $(el)
        const title = $el.find('a').html()
        titles.push(title)

        if(title){
          let words = title.split(' ');
          words.map((elWord)=>{
            elWord = elWord.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')
            if(elWord.startsWith('\xa0')){
              trash.push(elWord)
            }else if(/.+(은|는|이|가|을|를|의|입니다)/g.test(elWord)){
              const fword = /(.+)(은|는|이|가|을|를|의|입니다)/g.exec(elWord)
              gem.push([fword[1],title])
            }else{
              gem.push([elWord,title])
            }
          })
        }


      })

      resolve({sitename:site,content:titles,trash:trash,gem:gem})
    })


  })
}

function mainCrawl(cb) {

  const targets = [
    'todayhumor',
    'ruliweb',
    'slr',
    'inven',
    'dc'
  ]

  let promises = []
  targets.map((elTarget)=>{
    promises.push(crawl(elTarget))
  })

  Promise.all(promises).then((results)=>{
    console.log('crawl finished --- ' + moment().tz('Asia/Seoul').format('YYYY-MM-DD hh:ss'))
    cb(results)
  })
} 

