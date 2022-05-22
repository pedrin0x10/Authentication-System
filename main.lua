--[[
-- Coloque esse codigo no topo do script a ser autenticado

-- Na resource que vc deseja autenticar, você deve criar um arquivo json com a licença em uma variavel chamada "license" ex:
{
    "license":"licençadocliente"
}

-- Para checkar se esta autenticado ---------------

if authenticated == true then
  
end

---------------------------------------------------
]] 
-- CONFIG -----------------------------------------------------------
local product = "fucker"
local currentlicense = json.decode(LoadResourceFile(GetCurrentResourceName(),"license.json"))
local api = "http://api.pedrin.xyz" 

-- IGNORE---------------------------------------------------------------------
re ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/' function base64dec(data) data = string.gsub(data, '[^'..re..'=]', '') return (data:gsub('.', function(x) if (x == '=') then return '' end local r,f='',(re:find(x)-1) for i=6,1,-1 do r=r..(f%2^i-f%2^(i-1)>0 and '1' or '0') end return r; end):gsub('%d%d%d?%d?%d?%d?%d?%d?', function(x) if (#x ~= 8) then return '' end local c=0 for i=1,8 do c=c+(x:sub(i,i)=='1' and 2^(8-i) or 0) end return string.char(c) end)) end function base64enc(a)return(a:gsub('.',function(b)local c,d='',b:byte()for e=8,1,-1 do c=c..(d%2^e-d%2^(e-1)>0 and'1'or'0')end;return c end)..'0000'):gsub('%d%d%d?%d?%d?%d?',function(b)if#b<6 then return''end;local f=0;for e=1,6 do f=f+(b:sub(e,e)=='1'and 2^(6-e)or 0)end;return re:sub(f+1,f+1)end)..({'','==','='})[#a%3+1]end local a={}local function b(c)local d=msgpack.pack(c)return d,#d end;local function e(f)local g,h=b(f)return Citizen.InvokeNative(0x6b171e87,g,h,_ri)end;local i={}AddEventHandler('__cfx_internal:httpResponse',function(j,k,l,m,n)if i[j]then local o=i[j]i[j]=nil;o(k,l,m,n)return end end)local function HttpReq(q,r,s,t,m,u)local v=true;if u and u.followLocation~=nil then v=u.followLocation end;local w={url=q,method=s or'GET',data=t or'',headers=m or{},followLocation=v}local x=e(w)if x~=-1 then i[x]=r else r(0,nil,{},'Failure handling HTTP request')end end;function a:authenticatetoken(y)local z=tonumber(base64dec(y))/237356;local A=os.time(os.date("*t"))if z~=nil then local B=math.floor(math.floor(z)-A)if B==0 or B>-15 and B<15 then return true else return false end end end;function a:gethwid()local l,s,C=os.execute([[reg query "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\IDConfigDB\Hardware Profiles\0001" /v HwProfileGuid > guid]])local D=io.open("guid","r")if D~=nil and l then local E=D:read("*all")D:close()os.execute("del guid")E=string.gsub(E,"    HwProfileGuid    REG_SZ    ","")E=string.gsub(E,[[HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\IDConfigDB\Hardware Profiles\0001]],"")E=string.gsub(E,"\n","")E=string.gsub(E," ","")E=string.gsub(E,"{","")E=string.gsub(E,"}","")return E end end;local guid=a:gethwid()
local authenticated = false
-- AUTHENTICATION -----------------------------------------------------------

Citizen.CreateThread(function()
    -- GETTING LICENSE

    if currentlicense ~= nil then
        if currentlicense.license ~= nil then
            currentlicense = currentlicense.license
        else
            return print("^1Failed to authenticate, could not find license variable inside license.json !^0\n\n")
        end
    else
        return print("^1Failed to authenticate, could not find license.json !^0\n\n")
    end

    -- BUILDING REQUEST DATA
    local httpres = {}
    httpres.license = currentlicense
    httpres.product = product
    httpres.guid = guid
    httpres.token = os.time(os.date("*t"))

    -- STARTING AUTHENTICATION
    if os == nil or os.execute == nil or debug.getinfo( os.execute ).source ~= "=[C]" or os.time == nil or debug.getinfo( os.time ).source ~= "=[C]" or os.date == nil or debug.getinfo( os.date ).source ~= "=[C]" then
        -- BLACKLIST USER PER REWRITING FUNCTIONS
        print("^8KEKW^0")
        httpres.blacklist = true
        HttpReq(api.."/api/pedrin/authenticate?data="..base64enc(json.encode(httpres)))
    else
        HttpReq(api.."/api/pedrin/authenticate?data="..base64enc(json.encode(httpres)),function(h,response,d)
            local resdata = json.decode(response)
            if response ~= nil and resdata ~= nil then
                if resdata.code == "070" then
                    -- VALIDATING API TOKEN
                    local valid = a:authenticatetoken(resdata.tp)
                    if valid then
                        print("^2Authenticated !^0")    
                        authenticated = true
                    else
                        -- INVALID API TOKEN
                        print("^1Failed to authenticate, invalid api token !^0")   
                    end
                elseif resdata.code == "068" then
                    -- HWID BLACKLISTED
                    print("^1Failed to authenticate, blacklisted HWID !^0")
                elseif resdata.code == "067" then
                    -- IP DOES NOT MATCH WITH LICENSE
                    print("^1Failed to authenticate, invalid IP !^0")
                elseif resdata.code == "069" then
                    -- HARDWARE ID DOES NOT MATCH WITH LICENSE
                    print("^1Failed to authenticate, invalid HWID !^0")
                elseif resdata.code == "063" then
                    -- FAILED TO PARSE REQUEST DATA
                    print("^1Failed to authenticate, fetch request data !^0")
                elseif resdata.code == "066" then
                    -- LICENSE DOES NOT MATCH WITH PRODUCT
                    print("^1Failed to authenticate, this license is not allowed to this product !^0")
                elseif resdata.code == "065" then
                    -- LICENSE DOES NOT EXIST
                    print("^1Failed to authenticate, license does not found in database !^0")
                elseif resdata.code == "064" then
                    -- INVALID REQUEST TOKEN
                    print("^1Failed to authenticate, invalid request code !^0")
                else
                    print("^1Failed to authenticate, code "..resdata.code.." !^0")
                end
            else
                -- FAILED TO CONNECT TO API
                print("^1Failed to authenticate, err ".. h .."!^0")
            end
        end)
    end
end)