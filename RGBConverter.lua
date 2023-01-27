local RunService = game:GetService("RunService")

local function GenerateMaskForBit(bit)
	local newMask = 0
	
	for i = 0, bit - 1 do
		newMask += bit32.lshift(1, i)
	end
	
	return newMask
end

local function yield(n)
	for i = 1, n do RunService.Heartbeat:Wait() end
end

local Uncompressed = 24
local function GetRGBFromNumberWithBits(bits, n) -- [Lossy]
	--[[
		9 Bit  conversion (example)
		511    (111 111 111) --BBBGGGRRR
 			   (bitwise and)
		r=&7   (000 000 111) --RRR ------> 7
		g=&56  (000 111 000) --GGG << 3 -> 7 (shift for both bits because they are offsetted)
		b=&448 (111 000 000) --BBB << 6 -> 7
		
		r = 7 << 5 -> 224 (reconvert back into [0-255])
		g = 7 << 5 -> 224
		b = 7 << 5 -> 224
	]]
	
	local Bits = bits / 3
	
	local ReverseShift = (Uncompressed / 3) - Bits
	
	local RMask = GenerateMaskForBit(Bits)
	local GMask = bit32.lshift(RMask, Bits)
	local BMask = bit32.lshift(RMask, Bits * 2)
	
	local r = bit32.lshift(bit32.band(n, RMask), ReverseShift)--                               (n & RMask) << reverse
	local g = bit32.lshift(bit32.rshift(bit32.band(n, GMask), Bits), ReverseShift)--          ((n & GMask) >> Bits) << reverse
	local b = bit32.lshift(bit32.rshift(bit32.band(n, BMask), Bits * 2), ReverseShift)--      ((n & BMask) >> Bits * 2) << reverse
	
	return Color3.fromRGB(r,g,b)
end

--[[

for n = 0, 511 do
	local r = bit32.band(n, 7)
	local g = bit32.rshift(bit32.band(n, 56), 3)
	local b = bit32.rshift(bit32.band(n, 448), 6)
	palette[n + 1] = Color3.fromRGB(r * 34, g * 34, b * 34)
end

]]

return function(Bits)
	if Bits > Uncompressed or Bits < 3 then
		warn(`{Bits} bits is out of range of 3-{Uncompressed} bits`)
		return
	end
	
	local Palette = {}
	
	for n = 0, math.pow(2, Bits) - 1 do
		Palette[n + 1] = GetRGBFromNumberWithBits(Bits, n)
		
		if n % ((math.pow(2, Bits) - 1) / 8) == 0 then
			yield(Bits / 3)
		end
	end
	
	print(`Generated {Bits}-Bit RGB Palette with {math.pow(2, Bits)} possible colors`)
	return Palette
end
