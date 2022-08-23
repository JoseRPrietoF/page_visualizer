// var folder = "images/Notre_Dame_Roche_Paris_BnF_10996/Images/";
    // var folder = "images_prueba/"
    var folder = "images/"
    // var folder_images_all = "images_all/"
    var folder_images_all = "images_all_resized/"
    var folder_thumb = "images_thumbnails/";
    var folder_pages = "pages/" 
    // var folder_pages_hyp = "pages_hyp/" 
    var colors = {
        "AI": "red",
        "AM": "green",
        "AF": "blue",
        "AC": "purple",
    }

    var viewer;

    var dirs_selected = new Set()
    dirs_selected.add("Notre_Dame_Roche_Paris_BnF_10996/");
    dirs_selected.add("Port_Royal_2_Paris_BnF_10998/");
    dirs_selected.add("Molesme_2_Dijon_ADCO_Cart_143_7H7/");
    dirs_selected.add("Nesle_Chantilly_GB_Reg12_14F22/");

    function ajax_f(){
    $.ajax({
        url : folder,
        async : false,
        type: 'GET',
        success: function (data) {
            $(data).find("a").attr("href", function (i, val) {
                if( dirs_selected.has(val) ) { 
                    var path = folder + val + "Images/"
                    $("#images").append("<button button type='button' class='collapsible'>"+ val.slice(0, -1) +"</button> <div class='content' id=" + val.slice(0, -1) + "> </div>")
                    $.ajax({
                        url : path,
                        async : false,
                        type: 'GET',
                        success: function (data2) {
                            $(data2).find("a").attr("href", function (i, val2) {
                                
                                if( val2.match(/\.(jpe?g|png|gif)$/) ) { 
                                    // console.log(val2)
                                    var fname = val2.slice(0, -4)
                                    var value_path = val.slice(0, -1) + "_" + val2
                                    $("#"+val.slice(0, -1)).append( "<div class='imgs'><h5>"+fname+"</h5><img class='btn btn-primary child' value='"+ value_path +"' style='height:200px;width:200px'> </img></div>" );
                                } 
                            }); // find dataw
                        }// sucess ajax
                    }); 
                } // if
                
            }); // Data find
            
        }, // success
    }); // ajax
}
    Promise.all([ajax_f()]).then(() => {
        // all requests finished successfully
        var options = {
                "title": true,
            }
        // viewer = new Viewer(document.getElementById('images'));
        // gallery.view()
    }).catch(() => {
        // all requests finished but one or more failed
    })

    // console.log($(".btn")[1])
    // $(".btn").each(function(){
    function aux(button){
        // console.log(i)
        // var button = $(this)[0]
        var val = button.getAttribute("value");
        button.style.backgroundImage  = "url('" + folder_thumb + val
        button.style.backgroundRepeat = "no-repeat";
        button.style.backgroundPosition = "center";
        button.style.backgroundSize = "cover";
        // console.log(val)


        button.addEventListener('click', function () {

            $("#loading")[0].style.display = 'block';
            var img = new Image();
            // var val = button.value;
            
            img.src = folder_images_all + val;
            // img.src = folder_thumb + val; // TODO remove


            // img.src = folder + val;



            var c = document.createElement('canvas');
            // c.width = window.innerWidth;;
            // c.height = window.innerHeight;
            c.width = 1000;
            c.height = 1000;
            var ctx = c.getContext("2d");
            var fname = val.replace(/\.[^/.]+$/, "")
            folder_pages = $( "#pages option:selected" ).val();
            var from = $( "#pages option:selected" ).text();
            console.log("From: " + folder_pages + " -> " + from)
            var xml_path = folder_pages + fname + ".xml"

            img.onload = function()
            // img.onload = function()
            {   
                console.log("Inside")
                ctx.drawImage(img, 0, 0, img.width,img.height,0,0,c.width,c.height);
                
                var text_size = 25;
                var lineWidth_stroke = 3;
                ctx.lineWidth = 150;
                
                var markers = null;
                var coords_all = [];
                $.get(xml_path, {}, function (xml){
                    var imageWidth_page = $('Page',xml)[0].getAttribute("imageWidth");
                    var imageHeight_page = $('Page',xml)[0].getAttribute("imageHeight");
                    // var coords = $(this)[0].getAttribute("points")
                    $('TextRegion',xml).each(function(i){
                        var xs = []
                        var ys = []
                        markers = $(this);
                        var type_act = markers[0].getAttribute("custom").split("type:")[1].split(";")[0]
                        var text_ = type_act;
                        if(folder_pages.includes("hyp")){
                            var prob_bbox = markers[0].getAttribute("custom").split("probBbox:")[1].split(";")[0]
                            var probType = markers[0].getAttribute("custom").split("probType:")[1].split(";")[0]
                            prob_bbox = (Math.round(prob_bbox * 100) / 100).toFixed(2);
                            probType = (Math.round(probType * 100) / 100).toFixed(2);
                        }

                        ctx.fillStyle = colors[type_act];
                        $('Coords',markers).each(function(i){
                            var coords = $(this)[0].getAttribute("points")
                            coords = coords.trim().split(" ")
                            
                            for (var ii = 0; ii < coords.length; ii++) {
                                var xy = coords[ii].split(",")
                                xs.push(parseInt(xy[0]))
                                ys.push(parseInt(xy[1]))
                                
                            }
                            var min_x = Math.min(...xs)
                            var max_x = Math.max(...xs)
                            var min_y = Math.min(...ys)
                            var max_y = Math.max(...ys)
                            var twidth = Math.abs(min_x - max_x)
                            var theight =  Math.abs(min_y - max_y)
                            min_x = parseInt((min_x/imageWidth_page) * c.height)
                            max_x = parseInt((max_x/imageWidth_page) * c.height)
                            min_y = parseInt((min_y/imageHeight_page) * c.width)
                            max_y = parseInt((max_y/imageHeight_page) * c.width)
                            twidth = parseInt((twidth/imageWidth_page) * c.width)
                            theight = parseInt((theight/imageHeight_page) * c.height)
                            coords_all.push([min_x, min_y, twidth, theight, type_act])
                            
                            ctx.font = text_size+"px Arial";
                            ctx.strokeStyle = "black";
                            ctx.fillStyle = "black";
                            ctx.fillText(text_, min_x+text_size/2, min_y+text_size);
                            if(folder_pages.includes("hyp")){
                                ctx.fillText(" Prob Bbox: " + prob_bbox, min_x+text_size/2, min_y+text_size + text_size);
                                ctx.fillText(" Prob Act: " + probType, min_x+text_size/2, min_y+text_size + text_size*2);
                            }
                            ctx.stroke();
                        })
                    });
                    ctx.lineWidth = lineWidth_stroke;
                    for (var j = 0; j < coords_all.length; j++) { 
                        ctx.beginPath();
                        ctx.strokeStyle = colors[coords_all[j][4]];
                        
                        ctx.rect(coords_all[j][0],coords_all[j][1],coords_all[j][2],coords_all[j][3]);
                        ctx.globalAlpha = 0.2;
                        ctx.fillStyle = colors[coords_all[j][4]];
                        ctx.fillRect(coords_all[j][0],coords_all[j][1],coords_all[j][2],coords_all[j][3]);
                        ctx.globalAlpha = 1.0;
                        ctx.stroke();
                        
                    }
                    
                    const img2 = c.toDataURL('image/png')
                    img.src = img2;
                   
                    img.onload = function(){}

                    button.setAttribute("src2", img2);
                    console.log(fname)
                    viewer = new Viewer(img, {
                        url:"src" ,
                        title: fname,
                        hidden: function () {
                            console.log("Destroy")
                            viewer.destroy();
                        },
                    });

                    viewer.view();
                    $("#loading")[0].style.display = 'none';
                });
                

                
                // exit
            }
            
        })

        
    // })
    }
    var viewer = new Viewer(document.getElementById('images'), {
        // url:"src2" ,
        url : function(i){aux(i)}, 
        hidden: function () {
            viewer.destroy();
        },
    });
