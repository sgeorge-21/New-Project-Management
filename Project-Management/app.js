const products=[
 {id:1,name:"Aurora Laptop 14",category:"computers",description:"Lightweight power for every day.",price:899,stock:8,badge:"Best seller",image:"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=700&q=80"},
 {id:2,name:"Pixel One Pro",category:"mobile",description:"A sharper way to connect.",price:749,stock:14,badge:"New",image:"https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=700&q=80"},
 {id:3,name:"Studio Quiet Headphones",category:"audio",description:"Focus, without the noise.",price:249,stock:21,badge:"Popular",image:"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80"},
 {id:4,name:"Tab Pro 11",category:"computers",description:"Big ideas in a slim frame.",price:529,stock:6,badge:"Staff pick",image:"https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=700&q=80"},
 {id:5,name:"Everyday Smartwatch",category:"mobile",description:"Your day, at a glance.",price:199,stock:17,badge:"New",image:"https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80"},
 {id:6,name:"Device Care Plan",category:"repair",description:"Priority support and repairs.",price:89,stock:20,badge:"Service",image:"https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=700&q=80"},
 {id:7,name:"AeroBook Pro 16",category:"computers",description:"Desktop-class performance on the move.",price:1299,stock:5,badge:"Premium",image:"https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=700&q=80"},
 {id:8,name:"HomeHub Mini",category:"mobile",description:"Simple control for your connected home.",price:129,stock:11,badge:"Smart home",image:"https://images.unsplash.com/photo-1558089687-f282ffcbc126?auto=format&fit=crop&w=700&q=80"},
 {id:9,name:"SoundBar Air",category:"audio",description:"Room-filling sound in a compact bar.",price:329,stock:9,badge:"Popular",image:"https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=700&q=80"},
 {id:10,name:"Pro Camera Kit",category:"audio",description:"Sharp detail for work and creativity.",price:679,stock:4,badge:"Creator pick",image:"https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=700&q=80"},
 {id:11,name:"FastCharge Dock",category:"mobile",description:"One tidy station for every device.",price:79,stock:26,badge:"Accessory",image:"https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=700&q=80"},
 {id:12,name:"Screen & Battery Service",category:"repair",description:"Professional repair for phones and tablets.",price:149,stock:12,badge:"Service",image:"https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=700&q=80"},
 {id:13,name:"LinkWave Wi-Fi 6 Router",category:"networking",description:"Fast, reliable coverage for your whole home.",price:179,stock:10,badge:"Networking",image:"https://images.unsplash.com/photo-1647427060118-4911c9821b82?auto=format&fit=crop&w=700&q=80"},
 {id:14,name:"LinkWave Mesh Router",category:"networking",description:"Seamless connection across larger spaces.",price:299,stock:7,badge:"Best coverage",image:"https://images.unsplash.com/photo-1606904825846-647eb07f5beb?auto=format&fit=crop&w=700&q=80"},
 {id:15,name:"ProConnect 8-Port Switch",category:"networking",description:"Stable wired connections for work and play.",price:89,stock:15,badge:"Network",image:"https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=700&q=80"},
 {id:16,name:"ProConnect 24-Port Switch",category:"networking",description:"Expandable performance for growing teams.",price:239,stock:5,badge:"Business",image:"https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=700&q=80"}
];
const articles=[
 {date:"May 18, 2026",type:"Care guide",title:"How to make your laptop last longer",image:"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80"},
 {date:"May 04, 2026",type:"Our approach",title:"The G3 guide to buying refurbished",image:"https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=800&q=80"},
 {date:"Apr 22, 2026",type:"Behind the scenes",title:"Meet the makers: inside our repair bench",image:"https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"}
];
let cart=JSON.parse(localStorage.getItem("g3-cart")||"[]");
const $=s=>document.querySelector(s);
async function apiRequest(route,{method="GET",body}={}) {
 const endpoint=new URL("api/index.php",window.location.href);
 endpoint.searchParams.set("route",route);
 let response;
 try {
  response=await fetch(endpoint,{method,credentials:"same-origin",headers:{"Content-Type":"application/json","Accept":"application/json"},body:body?JSON.stringify(body):undefined});
 } catch {
  throw new Error("Cannot reach the PHP API. Open this site through your PHP server (for example, http://localhost/your-project/) and try again.");
 }
 const contentType=response.headers.get("content-type")||"";
 if(!contentType.includes("application/json")) {
  throw new Error("The API did not return JSON. Check that PHP is running and that api/index.php is reachable from this site.");
 }
 let data;
 try {
  data=await response.json();
 } catch {
  throw new Error("The API returned invalid JSON.");
 }
 if(!response.ok) throw new Error(data.error||"The request could not be completed.");
 return data;
}
function updateBasket(){document.querySelectorAll(".basket strong").forEach(el=>el.textContent=cart.length);localStorage.setItem("g3-cart",JSON.stringify(cart))}
function drawProducts(filter="all"){const grid=$("#products");if(!grid)return;const filtered=filter==="all"?products:products.filter(p=>p.category===filter);const limit=grid.dataset.limit?Number(grid.dataset.limit):filtered.length;const list=filtered.slice(0,limit);grid.innerHTML=list.map(p=>`<article class="product" tabindex="0" data-id="${p.id}" aria-label="Buy ${p.name}"><div class="image"><img src="${p.image}" alt="${p.name}" loading="lazy"><span class="badge">${p.badge}</span></div><div class="product-info"><h3>${p.name}</h3><p>${p.description}</p><small class="stock">${p.stock} in stock</small><div class="product-bottom"><b>$${p.price}</b><span class="plus">+</span></div></div></article>`).join("");grid.querySelectorAll(".product").forEach(card=>{const add=()=>{cart.push(products.find(p=>p.id===Number(card.dataset.id)));updateBasket();openCheckout()};card.addEventListener("click",add);card.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" ")add()})})}
function openCheckout(){if(!$("#checkout"))return;$("#summary").innerHTML=cart.length?`<span>${cart.length} item${cart.length>1?"s":""} selected</span><strong>$${cart.reduce((sum,p)=>sum+p.price,0)}</strong>`:"<span>Your basket is empty.</span><strong>$0</strong>";const productName=$("#payment input[name='productName']");const quantity=$("#payment input[name='quantity']");if(productName)productName.value=cart.length?[...new Set(cart.map(p=>p.name))].join(", "):"";if(quantity)quantity.value=cart.length?String(cart.length):"0";$("#checkout").classList.add("open");$("#shade").classList.add("open");$("#checkout").setAttribute("aria-hidden","false")}
function closeCheckout(){if(!$("#checkout"))return;$("#checkout").classList.remove("open");$("#shade").classList.remove("open");$("#checkout").setAttribute("aria-hidden","true")}
document.querySelectorAll(".filters button").forEach(btn=>btn.addEventListener("click",()=>{document.querySelector(".filters .selected").classList.remove("selected");btn.classList.add("selected");drawProducts(btn.dataset.filter)}));
$("#basket")?.addEventListener("click",openCheckout);$(".close")?.addEventListener("click",closeCheckout);$("#shade")?.addEventListener("click",closeCheckout);
document.querySelector(".menu")?.addEventListener("click",e=>{const nav=document.querySelector(".header nav");const open=nav.classList.toggle("open");e.currentTarget.setAttribute("aria-expanded",open)});
if($("#articles"))$("#articles").innerHTML=articles.map(a=>`<article class="article"><img src="${a.image}" alt="" loading="lazy"><div><small>${a.type} · ${a.date}</small><h2>${a.title}</h2><a href="contact.html">Read story ↗</a></div></article>`).join("");
$("#payment")?.addEventListener("submit",async e=>{e.preventDefault();const form=e.currentTarget;const status=form.querySelector(".status");if(!cart.length){status.textContent="Your basket is empty.";return}const items=Object.values(cart.reduce((group,product)=>{group[product.id]=group[product.id]||{productId:product.id,quantity:0};group[product.id].quantity++;return group},{}));const formData=new FormData(form);status.textContent="Saving your order…";try{const result=await apiRequest("orders",{method:"POST",body:{name:formData.get("name"),email:formData.get("email"),paymentMethod:formData.get("paymentMethod"),items}});cart=[];updateBasket();form.reset();status.textContent=`Order #${result.orderId} saved. Total: $${result.total}. Payment has not been processed.`;openCheckout()}catch(error){status.textContent=error.message}});
$("#contact-form")?.addEventListener("submit",async e=>{e.preventDefault();const form=e.currentTarget;const status=form.querySelector(".status");const data=Object.fromEntries(new FormData(form));status.textContent="Sending your message…";try{await apiRequest("contact",{method:"POST",body:data});form.reset();status.textContent="Thanks — your message has been received. We’ll be in touch shortly."}catch(error){status.textContent=error.message}});
let authMode="login";
function openAuth(mode="login"){const modal=$("#auth-modal");if(!modal)return;authMode=mode;$("#auth-title").textContent=mode==="signup"?"Create an account":"Log in";$("#auth-submit-label").textContent=mode==="signup"?"Sign up":"Log in";$("#auth-password").setAttribute("autocomplete",mode==="signup"?"new-password":"current-password");$("#auth-switch").textContent=mode==="signup"?"Already have an account? Log in":"Need an account? Sign up";$("#auth-status").textContent="";modal.classList.add("open");$("#auth-shade").classList.add("open");modal.setAttribute("aria-hidden","false");$("#auth-email").focus()}
function closeAuth(){if(!$("#auth-modal"))return;$("#auth-modal").classList.remove("open");$("#auth-shade").classList.remove("open");$("#auth-modal").setAttribute("aria-hidden","true")}
document.querySelectorAll("[data-auth-mode]").forEach(button=>button.addEventListener("click",()=>openAuth(button.dataset.authMode)));
$(".auth-close")?.addEventListener("click",closeAuth);$("#auth-shade")?.addEventListener("click",closeAuth);
$("#auth-switch")?.addEventListener("click",()=>openAuth(authMode==="signup"?"login":"signup"));
$("#google-auth")?.addEventListener("click",()=>{$("#auth-status").textContent="Google sign-in will be available when Google authentication is connected. You can use email and password for this demo.";});
$("#auth-form")?.addEventListener("submit",async e=>{e.preventDefault();const form=e.currentTarget;const data=Object.fromEntries(new FormData(form));const status=$("#auth-status");status.textContent=authMode==="signup"?"Creating your account…":"Logging in…";try{const result=await apiRequest(authMode==="signup"?"auth/signup":"auth/login",{method:"POST",body:data});status.textContent=`You are signed in as ${result.user.email}.`;form.reset()}catch(error){status.textContent=error.message}});
drawProducts();updateBasket();
